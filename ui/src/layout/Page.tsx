import { ReactNode } from 'react';
import { Box, Stack, Typography, alpha } from '@mui/material';
import { OverridableComponent } from '@mui/material/OverridableComponent';
import { SvgIconTypeMap } from '@mui/material/SvgIcon';

type IconComponent = OverridableComponent<SvgIconTypeMap<{}, 'svg'>>;

interface PageHeaderProps {
    icon: IconComponent;
    title: ReactNode;
    description?: ReactNode;
    actions?: ReactNode;
    color?: string;
}

export const pagePadding = { xs: 2, sm: 3, lg: 4 } as const;

export const PageContainer = ({ children }: { children: ReactNode }) => (
    <Box
        sx={{
            width: '100%',
            maxWidth: 1600,
            minWidth: 0,
            mx: 'auto',
            p: pagePadding,
            boxSizing: 'border-box',
        }}
    >
        {children}
    </Box>
);

export const PageHeader = ({
    icon: Icon,
    title,
    description,
    actions,
    color = '#3182ce',
}: PageHeaderProps) => (
    <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        alignItems={{ xs: 'stretch', sm: 'center' }}
        sx={{ mb: { xs: 2.5, md: 3.5 }, minWidth: 0 }}
    >
        <Stack direction="row" spacing={2} alignItems="center" sx={{ minWidth: 0 }}>
            <Box
                sx={{
                    width: 48,
                    height: 48,
                    flex: '0 0 auto',
                    borderRadius: 2,
                    display: 'grid',
                    placeItems: 'center',
                    color: 'white',
                    background: `linear-gradient(135deg, ${color} 0%, ${alpha(color, 0.78)} 100%)`,
                    boxShadow: `0 6px 14px ${alpha(color, 0.2)}`,
                }}
            >
                <Icon fontSize="medium" />
            </Box>
            <Box sx={{ minWidth: 0 }}>
                <Typography
                    component="h1"
                    variant="h4"
                    sx={{
                        fontWeight: 700,
                        fontSize: { xs: '1.5rem', md: '1.75rem' },
                        lineHeight: 1.2,
                    }}
                >
                    {title}
                </Typography>
                {description && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.35 }}>
                        {description}
                    </Typography>
                )}
            </Box>
        </Stack>
        {actions && (
            <Box sx={{ ml: { sm: 'auto' }, flex: '0 0 auto' }}>
                {actions}
            </Box>
        )}
    </Stack>
);
