import { FC, createElement } from 'react';
import { Card, Box, Typography, alpha } from '@mui/material';
import { Link, To } from 'react-router-dom';
import { ReactNode } from 'react';

interface Props {
    icon: FC<any>;
    to: To;
    title?: string;
    subtitle?: ReactNode;
    children?: ReactNode;
    color?: string;
}

const CardWithIcon = ({ icon, title, subtitle, to, children, color = '#3182ce' }: Props) => (
    <Card
        sx={{
            minHeight: 140,
            display: 'flex',
            flexDirection: 'column',
            flex: '1',
            position: 'relative',
            overflow: 'hidden',
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            },
            '& a': {
                textDecoration: 'none',
                color: 'inherit',
            },
        }}
    >
        <Link to={to}>
            <Box
                sx={{
                    p: 3,
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                    position: 'relative',
                }}
            >
                {/* Background decoration */}
                <Box
                    sx={{
                        position: 'absolute',
                        top: -20,
                        right: -20,
                        width: 100,
                        height: 100,
                        borderRadius: '50%',
                        backgroundColor: alpha(color, 0.1),
                    }}
                />
                <Box
                    sx={{
                        position: 'absolute',
                        top: 10,
                        right: 10,
                        width: 60,
                        height: 60,
                        borderRadius: '50%',
                        backgroundColor: alpha(color, 0.05),
                    }}
                />
                
                {/* Icon */}
                <Box
                    sx={{
                        width: 48,
                        height: 48,
                        borderRadius: 2,
                        backgroundColor: alpha(color, 0.1),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mb: 2,
                        color: color,
                    }}
                >
                    {createElement(icon, { sx: { fontSize: 24 } })}
                </Box>
                
                {/* Content */}
                <Box sx={{ position: 'relative', zIndex: 1 }}>
                    <Typography 
                        variant="h4" 
                        component="div"
                        sx={{ 
                            fontWeight: 700,
                            color: 'text.primary',
                            mb: 0.5,
                            lineHeight: 1.2,
                        }}
                    >
                        {subtitle || '0'}
                    </Typography>
                    <Typography 
                        variant="body2" 
                        sx={{ 
                            color: 'text.secondary',
                            fontWeight: 500,
                        }}
                    >
                        {title}
                    </Typography>
                </Box>
            </Box>
        </Link>
        {children}
    </Card>
);

export default CardWithIcon;
