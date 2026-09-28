package cmd

import (
	"os"
	"path/filepath"
	"testing"

	"github.com/distribworks/dkron/v4/dkron"
	"github.com/sirupsen/logrus"
	"github.com/spf13/viper"
	"github.com/stretchr/testify/require"
)

func TestInitConfigWebhookEndpoint(t *testing.T) {
	const legacy = "https://example.com/legacy"
	const endpoint = "https://example.com/current"

	tests := []struct {
		name  string
		yaml  string
		flags []string
		env   map[string]string
		want  string
	}{
		{name: "unset"},
		{
			name: "legacy config",
			yaml: "webhook-url: " + legacy,
			want: legacy,
		},
		{
			name: "current config",
			yaml: "webhook-endpoint: " + endpoint,
			want: endpoint,
		},
		{
			name: "both config names",
			yaml: "webhook-url: " + legacy + "\nwebhook-endpoint: " + endpoint,
			want: endpoint,
		},
		{
			name:  "legacy flag",
			flags: []string{"--webhook-url=" + legacy},
			want:  legacy,
		},
		{
			name: "legacy environment",
			env:  map[string]string{"DKRON_WEBHOOK_URL": legacy},
			want: legacy,
		},
		{
			name:  "current flag overrides legacy config",
			yaml:  "webhook-url: " + legacy,
			flags: []string{"--webhook-endpoint=" + endpoint},
			want:  endpoint,
		},
		{
			name: "current environment overrides legacy config",
			yaml: "webhook-url: " + legacy,
			env:  map[string]string{"DKRON_WEBHOOK_ENDPOINT": endpoint},
			want: endpoint,
		},
		{
			name:  "current config takes precedence over legacy flag",
			yaml:  "webhook-endpoint: " + endpoint,
			flags: []string{"--webhook-url=" + legacy},
			want:  endpoint,
		},
		{
			name: "current config takes precedence over legacy environment",
			yaml: "webhook-endpoint: " + endpoint,
			env:  map[string]string{"DKRON_WEBHOOK_URL": legacy},
			want: endpoint,
		},
		{
			name: "empty current config disables legacy webhook",
			yaml: "webhook-url: " + legacy + "\nwebhook-endpoint: ''",
		},
		{
			name:  "empty current flag disables legacy webhook",
			yaml:  "webhook-url: " + legacy,
			flags: []string{"--webhook-endpoint="},
		},
		{
			name: "empty current environment disables legacy config",
			yaml: "webhook-url: " + legacy,
			env:  map[string]string{"DKRON_WEBHOOK_ENDPOINT": ""},
		},
		{
			name:  "empty current environment disables legacy flag",
			flags: []string{"--webhook-url=" + legacy},
			env:   map[string]string{"DKRON_WEBHOOK_ENDPOINT": ""},
		},
		{
			name: "empty current environment disables legacy environment",
			env:  map[string]string{"DKRON_WEBHOOK_ENDPOINT": "", "DKRON_WEBHOOK_URL": legacy},
		},
		{
			name:  "current flag overrides empty current environment",
			yaml:  "webhook-url: " + legacy,
			flags: []string{"--webhook-endpoint=" + endpoint},
			env:   map[string]string{"DKRON_WEBHOOK_ENDPOINT": ""},
			want:  endpoint,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			oldConfig, oldFile := config, cfgFile
			oldHooks := logrus.StandardLogger().Hooks
			t.Cleanup(func() {
				config, cfgFile = oldConfig, oldFile
				logrus.StandardLogger().ReplaceHooks(oldHooks)
				viper.Reset()
			})
			logrus.StandardLogger().ReplaceHooks(make(logrus.LevelHooks))
			viper.Reset()
			for _, name := range []string{"DKRON_WEBHOOK_URL", "DKRON_WEBHOOK_ENDPOINT"} {
				t.Setenv(name, "")
				require.NoError(t, os.Unsetenv(name))
			}
			for name, value := range tt.env {
				t.Setenv(name, value)
			}

			config = dkron.DefaultConfig()
			cfgFile = filepath.Join(t.TempDir(), "dkron.yml")
			require.NoError(t, os.WriteFile(cfgFile, []byte("log-level: error\n"+tt.yaml), 0600))
			flags := dkron.ConfigFlagSet()
			require.NoError(t, flags.Parse(tt.flags))
			require.NoError(t, viper.BindPFlags(flags))

			require.NoError(t, initConfig())
			require.Equal(t, tt.want, config.WebhookEndpoint)
		})
	}
}
