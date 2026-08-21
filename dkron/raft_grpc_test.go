package dkron

import (
	"net"
	"testing"

	"github.com/stretchr/testify/require"
)

func TestRaftLayerAdvertiseAddr(t *testing.T) {
	listener, err := net.Listen("tcp", "127.0.0.1:0")
	require.NoError(t, err)
	t.Cleanup(func() { require.NoError(t, listener.Close()) })

	layer := NewRaftLayer(nil)
	require.NoError(t, layer.Open(listener))
	require.Equal(t, listener.Addr().String(), layer.Addr().String())

	advertiseAddr := &net.TCPAddr{IP: net.ParseIP("192.0.2.1"), Port: 6868}
	layer.SetAdvertiseAddr(advertiseAddr)
	require.Equal(t, advertiseAddr.String(), layer.Addr().String())
}
