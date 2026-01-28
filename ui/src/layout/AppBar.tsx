import { styled } from '@mui/material/styles';
import { AppBar, UserMenu, MenuItemLink, Logout, Link } from 'react-admin';
import { Box, Typography } from '@mui/material';
import BookIcon from '@mui/icons-material/Book';
import GitHubIcon from '@mui/icons-material/GitHub';
import Clock from './Clock';

import logo from '../images/dkron-logo.png';

const PREFIX = 'CustomAppBar';

const classes = {
    title: `${PREFIX}-title`,
    spacer: `${PREFIX}-spacer`,
    logo: `${PREFIX}-logo`
};

const StyledAppBar = styled(AppBar)(({ theme }) => ({
    backgroundColor: theme.palette.primary.main,
    '& .RaAppBar-toolbar': {
        minHeight: 64,
    },
    [`& .${classes.title}`]: {
        flex: 1,
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
    },
    [`& .${classes.spacer}`]: {
        flex: 1,
    },
    [`& .${classes.logo}`]: {
        maxWidth: "110px",
        filter: 'brightness(0) invert(1)',
    },
}));

const CustomUserMenu = (props: any) => (
    <UserMenu {...props}>
        <MenuItemLink
            to="https://dkron.io/docs/basics/getting-started"
            primaryText='Documentation'
            leftIcon={<BookIcon />}
        />
        <MenuItemLink
            to="https://github.com/distribworks/dkron"
            primaryText='GitHub'
            leftIcon={<GitHubIcon />}
        />
        <Logout />
    </UserMenu>
);

const CustomAppBar = (props: any) => {

    return (
        <StyledAppBar 
            {...props} 
            elevation={0} 
            userMenu={<CustomUserMenu />}
            sx={{
                borderBottom: '1px solid',
                borderColor: 'rgba(255, 255, 255, 0.1)',
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Link to="/" style={{ display: 'flex', alignItems: 'center' }}>
                    <img src={logo} alt="Dkron" className={classes.logo} />
                </Link>
            </Box>
            <Typography
                variant="h6"
                color="inherit"
                className={classes.title}
                id="react-admin-title"
                sx={{ ml: 2 }}
            />
            <span className={classes.spacer} />
            <Box 
                sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 2,
                    mr: 1,
                }}
            >
                <Clock />
            </Box>
        </StyledAppBar>
    );
};

export default CustomAppBar;
