import { defaultTheme } from 'react-admin';

// Modern, professional color palette
const primaryColor = '#1a365d'; // Deep blue
const secondaryColor = '#3182ce'; // Bright blue

export const lightTheme = {
    ...defaultTheme,
    palette: {
        mode: 'light' as const,
        primary: {
            main: primaryColor,
            light: '#2a4a7f',
            dark: '#0d1f3c',
            contrastText: '#ffffff',
        },
        secondary: {
            main: secondaryColor,
            light: '#63b3ed',
            dark: '#2c5282',
            contrastText: '#ffffff',
        },
        success: {
            main: '#38a169',
            light: '#68d391',
            dark: '#276749',
        },
        warning: {
            main: '#d69e2e',
            light: '#ecc94b',
            dark: '#b7791f',
        },
        error: {
            main: '#e53e3e',
            light: '#fc8181',
            dark: '#c53030',
        },
        info: {
            main: secondaryColor,
            light: '#63b3ed',
            dark: '#2c5282',
        },
        background: {
            default: '#f7fafc',
            paper: '#ffffff',
        },
        text: {
            primary: '#1a202c',
            secondary: '#4a5568',
        },
    },
    typography: {
        fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    },
    shape: {
        borderRadius: 8,
    },
    components: {
        ...defaultTheme.components,
        MuiCard: {
            styleOverrides: {
                root: {
                    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
                    borderRadius: 12,
                    border: '1px solid #e2e8f0',
                },
            },
        },
        MuiCardHeader: {
            styleOverrides: {
                root: {
                    padding: '20px 24px 16px',
                },
                title: {
                    fontSize: '1.125rem',
                    fontWeight: 600,
                    color: '#1a202c',
                },
            },
        },
        MuiCardContent: {
            styleOverrides: {
                root: {
                    padding: '16px 24px 24px',
                    '&:last-child': {
                        paddingBottom: 24,
                    },
                },
            },
        },
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: 8,
                    padding: '8px 16px',
                    fontWeight: 500,
                    boxShadow: 'none',
                    textTransform: 'none' as const,
                },
            },
        },
        MuiAppBar: {
            styleOverrides: {
                root: {
                    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
                },
            },
        },
        MuiDrawer: {
            styleOverrides: {
                paper: {
                    backgroundColor: '#1a365d',
                    color: '#ffffff',
                },
            },
        },
        MuiListItemIcon: {
            styleOverrides: {
                root: {
                    color: 'inherit',
                    minWidth: 40,
                },
            },
        },
        MuiTableCell: {
            styleOverrides: {
                root: {
                    borderBottom: '1px solid #e2e8f0',
                },
                head: {
                    fontWeight: 600,
                    backgroundColor: '#f7fafc',
                    color: '#4a5568',
                    fontSize: '0.75rem',
                    textTransform: 'uppercase' as const,
                    letterSpacing: '0.05em',
                },
            },
        },
        MuiTableRow: {
            styleOverrides: {
                root: {
                    '&:hover': {
                        backgroundColor: '#f7fafc',
                    },
                },
            },
        },
        MuiChip: {
            styleOverrides: {
                root: {
                    borderRadius: 6,
                    fontWeight: 500,
                },
            },
        },
        MuiTooltip: {
            styleOverrides: {
                tooltip: {
                    backgroundColor: '#1a202c',
                    fontSize: '0.75rem',
                    borderRadius: 6,
                },
            },
        },
        MuiTextField: {
            styleOverrides: {
                root: {
                    '& .MuiOutlinedInput-root': {
                        borderRadius: 8,
                    },
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                rounded: {
                    borderRadius: 12,
                },
            },
        },
        MuiTab: {
            styleOverrides: {
                root: {
                    textTransform: 'none' as const,
                    fontWeight: 500,
                },
            },
        },
    },
};
