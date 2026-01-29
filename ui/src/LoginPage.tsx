import React, { HtmlHTMLAttributes, ReactNode } from 'react';
import { useState } from 'react';
import {
    useLogin,
    useNotify,
    useSafeSetState,
} from 'react-admin';
import { styled } from '@mui/material/styles';
import { 
    Button,
    CardContent,
    CircularProgress,
    Card,
    SxProps,
    TextField,
    Typography,
    Box,
} from '@mui/material';
import logo from './images/dkron-logo.png';

const LoginPage = (props: LoginFormProps) => {
    const [token, setToken] = useState('');
    const login = useLogin();
    const notify = useNotify();
    const { className } = props;
    const [loading, setLoading] = useSafeSetState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        login({ token }).catch(() => {
            setLoading(false);
            notify('Invalid token');
        });
    };

    return (
        <Root>
            <Card className={LoginClasses.card}>
                <Box sx={{ pt: 4, pb: 2, px: 4, textAlign: 'center' }}>
                    <Box 
                        sx={{ 
                            mb: 3,
                            display: 'flex',
                            justifyContent: 'center',
                        }}
                    >
                        <img 
                            src={logo} 
                            alt="Dkron" 
                            style={{ 
                                maxWidth: 140,
                            }} 
                        />
                    </Box>
                    <Typography 
                        variant="h5" 
                        component="h1"
                        sx={{ 
                            fontWeight: 600,
                            color: 'text.primary',
                            mb: 1,
                        }}
                    >
                        Welcome Back
                    </Typography>
                    <Typography 
                        variant="body2" 
                        sx={{ color: 'text.secondary' }}
                    >
                        Sign in to access your job scheduler
                    </Typography>
                </Box>
                <form onSubmit={handleSubmit} className={className}>
                    <CardContent className={LoginFormClasses.content}>
                        <TextField
                            name="token"
                            label="Access Token"
                            type="password"
                            value={token}
                            onChange={e => setToken(e.target.value)}
                            fullWidth
                            variant="outlined"
                            margin="normal"
                            autoFocus
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: 2,
                                }
                            }}
                        />

                        <Button
                            variant="contained"
                            type="submit"
                            color="primary"
                            disabled={loading}
                            fullWidth
                            size="large"
                            sx={{
                                mt: 2,
                                mb: 1,
                                py: 1.5,
                                borderRadius: 2,
                                fontWeight: 600,
                                textTransform: 'none',
                                fontSize: '1rem',
                            }}
                        >
                            {loading ? (
                                <CircularProgress
                                    className={LoginFormClasses.icon}
                                    size={24}
                                    thickness={3}
                                    sx={{ color: 'white' }}
                                />
                            ) : (
                                "Sign In"
                            )}
                        </Button>
                    </CardContent>
                </form>
            </Card>
            <Typography 
                variant="body2" 
                sx={{ 
                    mt: 4, 
                    color: 'rgba(255, 255, 255, 0.6)',
                    textAlign: 'center',
                }}
            >
                Dkron - Distributed Job Scheduling System
            </Typography>
        </Root>
    );
};

export default LoginPage;

export interface LoginProps extends HtmlHTMLAttributes<HTMLDivElement> {
    avatarIcon?: ReactNode;
    backgroundImage?: string;
    children?: ReactNode;
    className?: string;
    sx?: SxProps;
}

const PREFIX = 'RaLogin';
export const LoginClasses = {
    card: `${PREFIX}-card`,
    avatar: `${PREFIX}-avatar`,
    icon: `${PREFIX}-icon`,
};

const Root = styled('div', {
    name: PREFIX,
    overridesResolver: (props, styles) => styles.root,
})(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    height: '1px',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundRepeat: 'no-repeat',
    backgroundSize: 'cover',
    background: 'linear-gradient(135deg, #1a365d 0%, #2c5282 50%, #1a365d 100%)',

    [`& .${LoginClasses.card}`]: {
        minWidth: 380,
        maxWidth: 420,
        borderRadius: 16,
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        overflow: 'hidden',
    },
    [`& .${LoginClasses.avatar}`]: {
        margin: '1em',
        display: 'flex',
        justifyContent: 'center',
    },
    [`& .${LoginClasses.icon}`]: {
        backgroundColor: theme.palette.secondary.main,
    },
}));

const PREFIXF = 'RaLoginForm';

export const LoginFormClasses = {
    content: `${PREFIXF}-content`,
    button: `${PREFIXF}-button`,
    icon: `${PREFIXF}-icon`,
};

export interface LoginFormProps {
    redirectTo?: string;
    className?: string;
}
