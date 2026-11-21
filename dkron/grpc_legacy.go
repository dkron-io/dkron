package dkron

import (
	"context"
	"strings"

	typesv1 "github.com/distribworks/dkron/v4/gen/proto/types/v1"
	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

// Dkron v4.0.8 and older served the same gRPC methods under the proto
// package "types" (types.Dkron, types.Agent). v4.0.9 moved them to
// "types.v1" with AgentService as the new name for Agent. The messages kept
// their field numbers, so only the service names differ on the wire. Nodes
// answer both names and retry calls under the old name, so a cluster can be
// upgraded one node at a time.
const (
	legacyDkronServiceName = "types.Dkron"
	legacyAgentServiceName = "types.Agent"

	dkronMethodPrefix       = "/" + "types.v1.Dkron" + "/"
	legacyDkronMethodPrefix = "/" + legacyDkronServiceName + "/"
	legacyAgentRunMethod    = "/" + legacyAgentServiceName + "/AgentRun"
)

// legacyServiceDesc returns a copy of desc served under serviceName.
func legacyServiceDesc(desc *grpc.ServiceDesc, serviceName string) *grpc.ServiceDesc {
	legacy := *desc
	legacy.ServiceName = serviceName
	legacy.Methods = append([]grpc.MethodDesc(nil), desc.Methods...)
	legacy.Streams = append([]grpc.StreamDesc(nil), desc.Streams...)
	return &legacy
}

// registerLegacyDkronServer serves srv under the pre v4.0.9 name types.Dkron.
func registerLegacyDkronServer(s grpc.ServiceRegistrar, srv typesv1.DkronServer) {
	s.RegisterService(legacyServiceDesc(&typesv1.Dkron_ServiceDesc, legacyDkronServiceName), srv)
}

// registerLegacyAgentServer serves srv under the pre v4.0.9 name types.Agent.
func registerLegacyAgentServer(s grpc.ServiceRegistrar, srv typesv1.AgentServiceServer) {
	s.RegisterService(legacyServiceDesc(&typesv1.AgentService_ServiceDesc, legacyAgentServiceName), srv)
}

// legacyDkronFallbackInterceptor retries a types.v1.Dkron call as
// types.Dkron when the server does not know the new name, which is the case
// for servers that still run v4.0.8 or older.
func legacyDkronFallbackInterceptor(ctx context.Context, method string, req, reply interface{}, cc *grpc.ClientConn, invoker grpc.UnaryInvoker, opts ...grpc.CallOption) error {
	err := invoker(ctx, method, req, reply, cc, opts...)
	if err == nil || !strings.HasPrefix(method, dkronMethodPrefix) || status.Code(err) != codes.Unimplemented {
		return err
	}
	legacyMethod := legacyDkronMethodPrefix + strings.TrimPrefix(method, dkronMethodPrefix)
	if legacyErr := invoker(ctx, legacyMethod, req, reply, cc, opts...); status.Code(legacyErr) != codes.Unimplemented {
		return legacyErr
	}
	return err
}

// openLegacyAgentRun starts AgentRun under the pre v4.0.9 name types.Agent.
func openLegacyAgentRun(ctx context.Context, conn grpc.ClientConnInterface, req *typesv1.AgentRunRequest) (grpc.ServerStreamingClient[typesv1.AgentRunStream], error) {
	stream, err := conn.NewStream(ctx, &typesv1.AgentService_ServiceDesc.Streams[0], legacyAgentRunMethod)
	if err != nil {
		return nil, err
	}
	x := &grpc.GenericClientStream[typesv1.AgentRunRequest, typesv1.AgentRunStream]{ClientStream: stream}
	if err := x.ClientStream.SendMsg(req); err != nil {
		return nil, err
	}
	if err := x.ClientStream.CloseSend(); err != nil {
		return nil, err
	}
	return x, nil
}
