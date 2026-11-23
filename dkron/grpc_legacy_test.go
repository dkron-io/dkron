package dkron

import (
	"context"
	"io"
	"net"
	"testing"
	"time"

	typesv1 "github.com/distribworks/dkron/v4/gen/proto/types/v1"
	"github.com/hashicorp/raft"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
)

type legacyAgentTestServer struct {
	typesv1.UnimplementedAgentServiceServer
}

func (legacyAgentTestServer) AgentRun(req *typesv1.AgentRunRequest, stream grpc.ServerStreamingServer[typesv1.AgentRunStream]) error {
	return stream.Send(&typesv1.AgentRunStream{Execution: req.Execution})
}

func startGRPCTestServer(t *testing.T, register func(*grpc.Server)) string {
	t.Helper()

	listener, err := net.Listen("tcp", "127.0.0.1:0")
	require.NoError(t, err)
	grpcServer := grpc.NewServer()
	register(grpcServer)
	go func() {
		_ = grpcServer.Serve(listener)
	}()
	t.Cleanup(func() {
		grpcServer.Stop()
		_ = listener.Close()
	})

	return listener.Addr().String()
}

func dialGRPCTestServer(t *testing.T, addr string) *grpc.ClientConn {
	t.Helper()

	conn, err := grpc.NewClient(addr, grpc.WithTransportCredentials(insecure.NewCredentials()))
	require.NoError(t, err)
	t.Cleanup(func() { _ = conn.Close() })
	return conn
}

// A v4.0.8 node calls /types.Dkron/ExecutionDone. A current node must answer it.
func TestLegacyDkronServiceNameIsServed(t *testing.T) {
	server := &executionDoneTestServer{}
	addr := startGRPCTestServer(t, func(s *grpc.Server) {
		typesv1.RegisterDkronServer(s, server)
		registerLegacyDkronServer(s, server)
	})
	conn := dialGRPCTestServer(t, addr)

	resp := &typesv1.ExecutionDoneResponse{}
	err := conn.Invoke(context.Background(), "/types.Dkron/ExecutionDone", &typesv1.ExecutionDoneRequest{
		Execution: &typesv1.Execution{JobName: "legacy"},
	}, resp)
	require.NoError(t, err)
	assert.Equal(t, []byte("saved"), resp.Payload)

	// The current name keeps working.
	_, err = typesv1.NewDkronClient(conn).ExecutionDone(context.Background(), &typesv1.ExecutionDoneRequest{
		Execution: &typesv1.Execution{JobName: "current"},
	})
	require.NoError(t, err)
	assert.Equal(t, int32(2), server.calls.Load())
}

// A v4.0.8 server calls /types.Agent/AgentRun. A current agent must answer it.
func TestLegacyAgentServiceNameIsServed(t *testing.T) {
	addr := startGRPCTestServer(t, func(s *grpc.Server) {
		typesv1.RegisterAgentServiceServer(s, legacyAgentTestServer{})
		registerLegacyAgentServer(s, legacyAgentTestServer{})
	})
	conn := dialGRPCTestServer(t, addr)

	stream, err := openLegacyAgentRun(context.Background(), conn, &typesv1.AgentRunRequest{
		Execution: &typesv1.Execution{JobName: "legacy"},
	})
	require.NoError(t, err)
	msg, err := stream.Recv()
	require.NoError(t, err)
	assert.Equal(t, "legacy", msg.Execution.JobName)
	_, err = stream.Recv()
	assert.Equal(t, io.EOF, err)
}

// A current node reports to a leader that still runs v4.0.8, which only
// serves types.Dkron. The client must fall back to the old name.
func TestGRPCClientFallsBackToLegacyDkronServiceName(t *testing.T) {
	server := &executionDoneTestServer{}
	addr := startGRPCTestServer(t, func(s *grpc.Server) {
		registerLegacyDkronServer(s, server)
	})

	clientConfig := DefaultConfig()
	clientConfig.AgentRunMaxRetries = 1
	clientConfig.AgentRunRetryInitialInterval = 0
	clientConfig.AgentRunRetryMaxInterval = 0
	agent := &Agent{
		config: clientConfig,
		leaderFn: func() raft.ServerAddress {
			return raft.ServerAddress(addr)
		},
	}
	client := NewGRPCClient(nil, agent, getTestLogger())

	execution := &Execution{
		JobName:    "legacy-leader",
		NodeName:   "upgraded-agent",
		StartedAt:  time.Now().UTC().Add(-time.Minute),
		FinishedAt: time.Now().UTC(),
		Success:    true,
		Group:      time.Now().UnixNano(),
		Attempt:    1,
	}
	require.NoError(t, client.ExecutionDone(addr, execution))
	assert.Equal(t, int32(1), server.calls.Load())
}
