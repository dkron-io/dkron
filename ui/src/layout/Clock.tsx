import { Component } from 'react';
import { Box, Typography } from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

class Clock extends Component<{}, { date: Date }> {
    timer: any;

    constructor(props: any) {
        super(props);
        this.state = { date: new Date() };
    }

    componentDidMount() {
        this.timer = setInterval(
            () => this.setState({ date: new Date() }),
            1000
        );
    }

    componentWillUnmount() {
        clearInterval(this.timer);
    }

    render() {
        return (
            <Box 
                sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 0.75,
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: 2,
                    px: 1.5,
                    py: 0.5,
                }}
            >
                <AccessTimeIcon sx={{ fontSize: 16, opacity: 0.9 }} />
                <Typography 
                    variant="body2" 
                    sx={{ 
                        fontFamily: '"Roboto Mono", monospace',
                        fontWeight: 500,
                        fontSize: '0.8rem',
                        letterSpacing: '0.02em',
                    }}
                >
                    {this.state.date.toLocaleTimeString()}
                </Typography>
            </Box>
        );
    }
}

export default Clock;
