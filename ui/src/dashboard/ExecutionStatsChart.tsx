import { Card, CardHeader, CardContent, CircularProgress, Box, Typography } from '@mui/material';
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
} from 'recharts';
import { useEffect, useState } from 'react';
import { httpClient, apiUrl } from '../dataProvider';

interface ExecutionStat {
    date: string;
    success_count: number;
    failed_count: number;
}

interface ExecutionStatsResponse {
    stats: ExecutionStat[];
}

interface ChartDataPoint {
    date: string;
    dateFormatted: string;
    success: number;
    failed: number;
    total: number;
}

const dateFormatter = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const ExecutionStatsChart = () => {
    const [data, setData] = useState<ChartDataPoint[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                setLoading(true);
                const response = await httpClient(`${apiUrl}/stats?days=30`);
                const statsResponse: ExecutionStatsResponse = response.json;
                
                const chartData: ChartDataPoint[] = statsResponse.stats.map((stat) => ({
                    date: stat.date,
                    dateFormatted: dateFormatter(stat.date),
                    success: stat.success_count,
                    failed: stat.failed_count,
                    total: stat.success_count + stat.failed_count,
                }));
                
                setData(chartData);
                setError(null);
            } catch (err) {
                console.error('Failed to fetch execution stats:', err);
                setError('Failed to load statistics');
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (loading) {
        return (
            <Card>
                <CardHeader title="Execution Statistics (Last 30 Days)" />
                <CardContent>
                    <Box display="flex" justifyContent="center" alignItems="center" height={300}>
                        <CircularProgress />
                    </Box>
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Card>
                <CardHeader title="Execution Statistics (Last 30 Days)" />
                <CardContent>
                    <Box display="flex" justifyContent="center" alignItems="center" height={300}>
                        <Typography color="error">{error}</Typography>
                    </Box>
                </CardContent>
            </Card>
        );
    }

    const totalSuccess = data.reduce((sum, d) => sum + d.success, 0);
    const totalFailed = data.reduce((sum, d) => sum + d.failed, 0);

    return (
        <Card>
            <CardHeader 
                title="Execution Statistics (Last 30 Days)" 
                subheader={`Total: ${totalSuccess + totalFailed} executions (${totalSuccess} successful, ${totalFailed} failed)`}
            />
            <CardContent>
                <div style={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer>
                        <AreaChart data={data}>
                            <defs>
                                <linearGradient id="colorSuccess" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#4caf50" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#4caf50" stopOpacity={0.1} />
                                </linearGradient>
                                <linearGradient id="colorFailed" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#f44336" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#f44336" stopOpacity={0.1} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis 
                                dataKey="dateFormatted" 
                                tick={{ fontSize: 12 }}
                                interval="preserveStartEnd"
                            />
                            <YAxis 
                                allowDecimals={false}
                                tick={{ fontSize: 12 }}
                            />
                            <Tooltip 
                                labelFormatter={(label) => {
                                    if (typeof label === 'string') {
                                        // Parse date from formatted string, but use actual date from first data point
                                        return label;
                                    }
                                    return String(label);
                                }}
                                formatter={(value: number, name: string) => {
                                    const displayName = name === 'success' ? 'Successful' : 'Failed';
                                    return [value, displayName];
                                }}
                            />
                            <Legend 
                                formatter={(value) => value === 'success' ? 'Successful' : 'Failed'}
                            />
                            <Area
                                type="monotone"
                                dataKey="success"
                                stackId="1"
                                stroke="#4caf50"
                                strokeWidth={2}
                                fill="url(#colorSuccess)"
                            />
                            <Area
                                type="monotone"
                                dataKey="failed"
                                stackId="1"
                                stroke="#f44336"
                                strokeWidth={2}
                                fill="url(#colorFailed)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
};

export default ExecutionStatsChart;
