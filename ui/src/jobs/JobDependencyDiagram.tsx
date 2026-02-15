import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useRecordContext, useDataProvider, useRedirect } from 'react-admin';
import {
  Box,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Chip,
} from '@mui/material';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import ScheduleIcon from '@mui/icons-material/Schedule';

interface Job {
  id: string;
  name: string;
  displayname?: string;
  parent_job?: string;
  dependent_jobs?: string[];
  status?: string;
}

interface DependencyNode {
  id: string;
  name: string;
  displayName: string;
  status: string;
  x: number;
  y: number;
  level: number;
  isCurrent: boolean;
}

interface DependencyEdge {
  from: string;
  to: string;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
}

const NODE_WIDTH = 160;
const NODE_HEIGHT = 60;
const LEVEL_HEIGHT = 100;
const NODE_SPACING = 20;

const SectionHeader = ({ icon: Icon, title }: { icon: any; title: string }) => (
  <Box
    sx={{
      display: 'flex',
      alignItems: 'center',
      gap: 1.5,
      mb: 2,
      pb: 1,
      borderBottom: '1px solid',
      borderColor: 'divider',
    }}
  >
    <Box
      sx={{
        width: 36,
        height: 36,
        borderRadius: 1.5,
        background: 'linear-gradient(135deg, #3182ce 0%, #2c5282 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
      }}
    >
      <Icon fontSize="small" />
    </Box>
    <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
      {title}
    </Typography>
  </Box>
);

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'success':
      return '#22c55e';
    case 'failed':
      return '#ef4444';
    case 'running':
      return '#f59e0b';
    default:
      return '#94a3b8';
  }
};

interface DiagramNodeProps {
  node: DependencyNode;
  onClick?: (id: string) => void;
}

const DiagramNode: React.FC<DiagramNodeProps> = ({ node, onClick }) => {
  const statusColor = getStatusColor(node.status);
  const displayName = node.displayName || node.name;
  const truncatedName = displayName.length > 18 ? displayName.substring(0, 15) + '...' : displayName;

  return (
    <g
      transform={`translate(${node.x}, ${node.y})`}
      style={{ cursor: onClick && !node.isCurrent ? 'pointer' : 'default' }}
      onClick={() => onClick && !node.isCurrent && onClick(node.id)}
    >
      {/* Node background */}
      <rect
        x={0}
        y={0}
        width={NODE_WIDTH}
        height={NODE_HEIGHT}
        rx={8}
        ry={8}
        fill={node.isCurrent ? '#1a365d' : '#ffffff'}
        stroke={node.isCurrent ? '#1a365d' : '#e2e8f0'}
        strokeWidth={node.isCurrent ? 3 : 2}
        style={{
          filter: node.isCurrent ? 'drop-shadow(0 4px 6px rgba(26, 54, 93, 0.3))' : 'drop-shadow(0 1px 3px rgba(0, 0, 0, 0.1))',
        }}
      />
      
      {/* Status indicator line */}
      <rect
        x={0}
        y={0}
        width={4}
        height={NODE_HEIGHT}
        rx={8}
        fill={statusColor}
      />
      
      {/* Job name */}
      <text
        x={NODE_WIDTH / 2}
        y={NODE_HEIGHT / 2 - 8}
        textAnchor="middle"
        fontSize="13"
        fontWeight="600"
        fill={node.isCurrent ? '#ffffff' : '#1a365d'}
      >
        <title>{displayName}</title>
        {truncatedName}
      </text>
      
      {/* Status text */}
      <text
        x={NODE_WIDTH / 2}
        y={NODE_HEIGHT / 2 + 12}
        textAnchor="middle"
        fontSize="11"
        fill={node.isCurrent ? '#94a3b8' : '#64748b'}
      >
        {node.status || 'untriggered'}
      </text>
      
      {/* Current job indicator */}
      {node.isCurrent && (
        <text
          x={NODE_WIDTH / 2}
          y={NODE_HEIGHT + 18}
          textAnchor="middle"
          fontSize="10"
          fontWeight="500"
          fill="#3182ce"
        >
          (current job)
        </text>
      )}
    </g>
  );
};

const DiagramEdge: React.FC<{ edge: DependencyEdge }> = ({ edge }) => {
  const startX = edge.fromX + NODE_WIDTH / 2;
  const startY = edge.fromY + NODE_HEIGHT;
  const endX = edge.toX + NODE_WIDTH / 2;
  const endY = edge.toY;
  
  // Calculate control points for smooth curve
  const midY = (startY + endY) / 2;
  
  return (
    <g>
      <path
        d={`M ${startX} ${startY} C ${startX} ${midY}, ${endX} ${midY}, ${endX} ${endY}`}
        fill="none"
        stroke="#94a3b8"
        strokeWidth={2}
        markerEnd="url(#arrowhead)"
      />
    </g>
  );
};

const buildDependencyGraph = (
  currentJob: Job,
  allJobs: Job[]
): { nodes: DependencyNode[]; edges: DependencyEdge[] } => {
  const nodes: DependencyNode[] = [];
  const edges: DependencyEdge[] = [];
  const jobMap = new Map<string, Job>(allJobs.map((j) => [j.name, j]));
  const processedAncestors = new Set<string>();
  const processedDescendants = new Set<string>();
  const jobLevels = new Map<string, number>();
  
  // Find all ancestors (jobs this job depends on)
  const findAncestors = (jobName: string, level: number): string[] => {
    if (processedAncestors.has(jobName)) return [];
    processedAncestors.add(jobName);
    const job = jobMap.get(jobName);
    if (!job) return [];
    
    const ancestors: string[] = [];
    if (job.parent_job && jobMap.has(job.parent_job)) {
      ancestors.push(job.parent_job);
      jobLevels.set(job.parent_job, level - 1);
      ancestors.push(...findAncestors(job.parent_job, level - 1));
    }
    return ancestors;
  };
  
  // Find all descendants (jobs that depend on this job)
  const findDescendants = (jobName: string, level: number): string[] => {
    if (processedDescendants.has(jobName)) return [];
    processedDescendants.add(jobName);
    const job = jobMap.get(jobName);
    if (!job) return [];
    
    const descendants: string[] = [];
    const children = job.dependent_jobs || [];
    children.forEach((childName) => {
      if (jobMap.has(childName)) {
        descendants.push(childName);
        jobLevels.set(childName, level + 1);
        descendants.push(...findDescendants(childName, level + 1));
      }
    });
    return descendants;
  };
  
  // Start with current job at level 0
  jobLevels.set(currentJob.name, 0);
  
  // Find all related jobs
  const ancestors = findAncestors(currentJob.name, 0);
  const descendants = findDescendants(currentJob.name, 0);
  const relatedJobs = new Set([currentJob.name, ...ancestors, ...descendants]);
  
  // Group jobs by level
  const levelGroups = new Map<number, string[]>();
  relatedJobs.forEach((jobName) => {
    const level = jobLevels.get(jobName) || 0;
    if (!levelGroups.has(level)) {
      levelGroups.set(level, []);
    }
    levelGroups.get(level)!.push(jobName);
  });
  
  // Sort levels
  const sortedLevels = Array.from(levelGroups.keys()).sort((a, b) => a - b);
  const minLevel = sortedLevels[0] || 0;
  
  // Calculate node positions
  const nodePositions = new Map<string, { x: number; y: number }>();
  let maxWidth = 0;
  
  sortedLevels.forEach((level) => {
    const jobsAtLevel = levelGroups.get(level) || [];
    const levelWidth = jobsAtLevel.length * (NODE_WIDTH + NODE_SPACING) - NODE_SPACING;
    maxWidth = Math.max(maxWidth, levelWidth);
  });
  
  sortedLevels.forEach((level) => {
    const jobsAtLevel = levelGroups.get(level) || [];
    const levelWidth = jobsAtLevel.length * (NODE_WIDTH + NODE_SPACING) - NODE_SPACING;
    const startX = (maxWidth - levelWidth) / 2;
    const y = (level - minLevel) * LEVEL_HEIGHT + 30;
    
    jobsAtLevel.forEach((jobName, index) => {
      const x = startX + index * (NODE_WIDTH + NODE_SPACING);
      nodePositions.set(jobName, { x, y });
      
      const job = jobMap.get(jobName);
      if (job) {
        nodes.push({
          id: jobName,
          name: jobName,
          displayName: job.displayname || jobName,
          status: job.status || 'untriggered',
          x,
          y,
          level: level - minLevel,
          isCurrent: jobName === currentJob.name,
        });
      }
    });
  });
  
  // Create edges
  relatedJobs.forEach((jobName) => {
    const job = jobMap.get(jobName);
    if (job?.parent_job && relatedJobs.has(job.parent_job)) {
      const fromPos = nodePositions.get(job.parent_job);
      const toPos = nodePositions.get(jobName);
      if (fromPos && toPos) {
        edges.push({
          from: job.parent_job,
          to: jobName,
          fromX: fromPos.x,
          fromY: fromPos.y,
          toX: toPos.x,
          toY: toPos.y,
        });
      }
    }
  });
  
  return { nodes, edges };
};

const JobDependencyDiagram: React.FC = () => {
  const record = useRecordContext<Job>();
  const dataProvider = useDataProvider();
  const redirect = useRedirect();
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoading(true);
        const response = await dataProvider.getList('jobs', {
          pagination: { page: 1, perPage: 1000 },
          sort: { field: 'name', order: 'ASC' },
          filter: {},
        });
        setAllJobs(response.data as Job[]);
        setError(null);
      } catch (err) {
        setError('Failed to load job dependencies');
        console.error('Error fetching jobs:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, [dataProvider]);

  const { nodes, edges } = useMemo(() => {
    if (!record || allJobs.length === 0) {
      return { nodes: [], edges: [] };
    }
    return buildDependencyGraph(record, allJobs);
  }, [record, allJobs]);

  const handleNodeClick = useCallback((jobId: string) => {
    redirect('show', 'jobs', jobId);
  }, [redirect]);

  if (!record) {
    return null;
  }

  const hasNoDependencies = nodes.length <= 1;
  const hasDependencies = !hasNoDependencies;
  
  // Calculate SVG dimensions
  const svgPadding = 40;
  const maxX = Math.max(...nodes.map((n) => n.x + NODE_WIDTH), 300);
  const maxY = Math.max(...nodes.map((n) => n.y + NODE_HEIGHT + 30), 150);
  const svgWidth = maxX + svgPadding * 2;
  const svgHeight = maxY + svgPadding;

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <SectionHeader icon={AccountTreeIcon} title="Job Dependencies" />
        
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        )}
        
        {error && (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <Typography color="error">{error}</Typography>
          </Box>
        )}
        
        {!loading && !error && hasNoDependencies && (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <AccountTreeIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="body1" color="text.secondary">
              This job has no parent or dependent jobs.
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Set a <strong>parent_job</strong> to create a dependency relationship.
            </Typography>
          </Box>
        )}
        
        {!loading && !error && hasDependencies && (
          <>
            <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Chip
                size="small"
                icon={<CheckCircleIcon />}
                label="Success"
                sx={{ backgroundColor: '#dcfce7', color: '#15803d' }}
              />
              <Chip
                size="small"
                icon={<ErrorIcon />}
                label="Failed"
                sx={{ backgroundColor: '#fee2e2', color: '#b91c1c' }}
              />
              <Chip
                size="small"
                icon={<HourglassEmptyIcon />}
                label="Running"
                sx={{ backgroundColor: '#fef3c7', color: '#b45309' }}
              />
              <Chip
                size="small"
                icon={<ScheduleIcon />}
                label="Untriggered"
                sx={{ backgroundColor: '#f1f5f9', color: '#475569' }}
              />
            </Box>
            
            <Box
              sx={{
                overflowX: 'auto',
                backgroundColor: '#f8fafc',
                borderRadius: 2,
                border: '1px solid #e2e8f0',
                p: 2,
              }}
            >
              <svg
                width={svgWidth}
                height={svgHeight}
                style={{ display: 'block', margin: '0 auto' }}
              >
                <defs>
                  <marker
                    id="arrowhead"
                    markerWidth="10"
                    markerHeight="7"
                    refX="9"
                    refY="3.5"
                    orient="auto"
                  >
                    <polygon points="0 0, 10 3.5, 0 7" fill="#94a3b8" />
                  </marker>
                </defs>
                
                <g transform={`translate(${svgPadding}, 0)`}>
                  {/* Render edges first (behind nodes) */}
                  {edges.map((edge, index) => (
                    <DiagramEdge key={`edge-${index}`} edge={edge} />
                  ))}
                  
                  {/* Render nodes */}
                  {nodes.map((node) => (
                    <DiagramNode
                      key={node.id}
                      node={node}
                      onClick={handleNodeClick}
                    />
                  ))}
                </g>
              </svg>
            </Box>
            
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: 'block', mt: 2, textAlign: 'center' }}
            >
              Click on a node to navigate to that job. Arrows indicate execution order (parent → child).
            </Typography>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default JobDependencyDiagram;
