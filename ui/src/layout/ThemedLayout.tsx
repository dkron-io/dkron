import { Layout, LayoutProps, Sidebar } from 'react-admin';
import { styled } from '@mui/material/styles';
import AppBar from './AppBar';

const CustomSidebar = styled(Sidebar)(({ theme }) => ({
    '& .RaSidebar-fixed': {
        backgroundColor: theme.palette.primary.main,
        color: '#ffffff',
        paddingTop: theme.spacing(2),
    },
    '& .MuiDrawer-paper': {
        backgroundColor: theme.palette.primary.main,
        color: '#ffffff',
        borderRight: 'none',
        paddingTop: theme.spacing(2),
    },
    '& .RaMenuItemLink-active': {
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        borderRadius: '8px',
        '&:before': {
            content: '""',
            position: 'absolute',
            left: 0,
            top: '50%',
            transform: 'translateY(-50%)',
            width: 4,
            height: '60%',
            backgroundColor: '#ffffff',
            borderRadius: '0 4px 4px 0',
        },
    },
    '& .MuiListItemIcon-root': {
        color: 'rgba(255, 255, 255, 0.8)',
    },
    '& .RaMenuItemLink-active .MuiListItemIcon-root': {
        color: '#ffffff',
    },
    '& .MuiTypography-root': {
        color: 'rgba(255, 255, 255, 0.9)',
    },
    '& .RaMenuItemLink-active .MuiTypography-root': {
        color: '#ffffff',
        fontWeight: 600,
    },
}));

const StyledSidebar = (props: any) => <CustomSidebar {...props} size={220} />;

const ThemedLayout = (props: LayoutProps) => {
    return (
        <Layout
            {...props}
            appBar={AppBar}
            sidebar={StyledSidebar}
            sx={{
                width: '100%',
                minWidth: 0,
                '&.RaLayout-root': {
                    minWidth: 0,
                },
                '& .RaLayout-appFrame, & .RaLayout-contentWithSidebar': {
                    width: '100%',
                    minWidth: 0,
                },
                '& .RaLayout-content': {
                    backgroundColor: '#f7fafc',
                    minWidth: 0,
                    maxWidth: '100%',
                    padding: 0,
                    overflowX: 'hidden',
                },
                '& .RaLayout-content > *': {
                    minWidth: 0,
                    maxWidth: '100%',
                },
            }}
        />
    );
};

export default ThemedLayout;
