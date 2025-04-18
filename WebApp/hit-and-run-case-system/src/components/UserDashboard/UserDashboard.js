import React, { useState, useEffect } from 'react';
import { useAuth } from '../Auth/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Button, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper, 
  Tabs, 
  Tab, 
  Chip,
  Collapse,
  IconButton,
  Avatar,
  List,
  ListItem,
  ListItemText,
  Divider
} from '@mui/material';
import { 
  Logout as LogoutIcon, 
  Add as AddIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  DirectionsCar as CarIcon
} from '@mui/icons-material';
import { database } from '../../firebase';
import { ref, onValue, off } from 'firebase/database';
import CaseRegistrationModal from './CaseRegistrationModal';

const statusColors = {
  pending: 'warning',
  approved: 'success',
  rejected: 'error'
};

const UserDashboard = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [openModal, setOpenModal] = useState(false);

  useEffect(() => {
    if (!currentUser) {
      navigate('/');
      return;
    }

    const casesRef = ref(database, `HitAndRunCaseReport/${currentUser.uid}`);
    
    const fetchData = () => {
      onValue(casesRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const casesArray = [];
          Object.entries(data).forEach(([date, reports]) => {
            Object.entries(reports).forEach(([reportId, report]) => {
              casesArray.push({
                id: reportId,
                reportDate: date,
                ...report
              });
            });
          });
          // Sort by report date (newest first)
          casesArray.sort((a, b) => 
            new Date(b.reportDate) - new Date(a.reportDate)
          );
          setCases(casesArray);
        } else {
          setCases([]);
        }
        setLoading(false);
      });
    };

    fetchData();

    return () => {
      off(casesRef);
    };
  }, [currentUser, navigate]);

  const pendingCases = cases.filter(caseItem => caseItem.status === 'pending');
  const completedCases = cases.filter(caseItem => caseItem.status === 'approved');
  const rejectedCases = cases.filter(caseItem => caseItem.status === 'rejected');

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
        <Typography variant="h4">Hit & Run Case Reports</Typography>
        <Box>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />}
            onClick={() => setOpenModal(true)}
            sx={{ mr: 2 }}
          >
            New Report
          </Button>
          <Button
            variant="outlined"
            startIcon={<LogoutIcon />}
            onClick={handleLogout}
          >
            Logout
          </Button>
        </Box>
      </Box>

      <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
        <Tab label={`Pending (${pendingCases.length})`} />
        <Tab label={`Completed (${completedCases.length})`} />
        <Tab label={`Rejected (${rejectedCases.length})`} />
      </Tabs>

      <Box sx={{ mt: 2 }}>
        {activeTab === 0 && <CaseTable cases={pendingCases} loading={loading} />}
        {activeTab === 1 && <CompletedCaseTable cases={completedCases} loading={loading} />}
        {activeTab === 2 && <CaseTable cases={rejectedCases} loading={loading} />}
      </Box>

      <CaseRegistrationModal 
        open={openModal} 
        onClose={() => setOpenModal(false)} 
        userId={currentUser?.uid}
      />
    </Box>
  );
};

const CaseTable = ({ cases, loading }) => {
  if (loading) return <Typography>Loading cases...</Typography>;
  if (cases.length === 0) return <Typography>No cases found</Typography>;

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Vehicle ID</TableCell>
            <TableCell>Report Date</TableCell>
            <TableCell>Accident Date</TableCell>
            <TableCell>Location</TableCell>
            <TableCell>Description</TableCell>
            <TableCell>Status</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {cases.map((caseItem) => (
            <TableRow key={caseItem.id}>
              <TableCell>{caseItem.vehicleId || 'N/A'}</TableCell>
              <TableCell>{new Date(caseItem.reportDate).toLocaleDateString()}</TableCell>
              <TableCell>
                {caseItem.dateOfAccident} at {caseItem.timeOfAccident?.substring(0, 5)}
              </TableCell>
              <TableCell>
                {caseItem.accidentLocation ? (
                  `${caseItem.accidentLocation.latitude?.toFixed?.(6) || 'N/A'}, 
                  ${caseItem.accidentLocation.longitude?.toFixed?.(6) || 'N/A'}`
                ) : 'N/A'}
              </TableCell>
              <TableCell sx={{ maxWidth: 300 }}>
                {caseItem.accidentDescription || 'No description'}
              </TableCell>
              <TableCell>
                <Chip 
                  label={caseItem.status} 
                  color={statusColors[caseItem.status] || 'default'}
                  variant="outlined"
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

const CompletedCaseTable = ({ cases, loading }) => {
  const [expandedCase, setExpandedCase] = useState(null);

  if (loading) return <Typography>Loading cases...</Typography>;
  if (cases.length === 0) return <Typography>No completed cases found</Typography>;

  const toggleExpand = (caseId) => {
    setExpandedCase(expandedCase === caseId ? null : caseId);
  };

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell />
            <TableCell>Vehicle ID</TableCell>
            <TableCell>Report Date</TableCell>
            <TableCell>Accident Date</TableCell>
            <TableCell>Location</TableCell>
            <TableCell>Description</TableCell>
            <TableCell>Status</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {cases.map((caseItem) => (
            <React.Fragment key={caseItem.id}>
              <TableRow>
                <TableCell>
                  <IconButton
                    aria-label="expand row"
                    size="small"
                    onClick={() => toggleExpand(caseItem.id)}
                  >
                    {expandedCase === caseItem.id ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  </IconButton>
                </TableCell>
                <TableCell>{caseItem.vehicleId || 'N/A'}</TableCell>
                <TableCell>{new Date(caseItem.reportDate).toLocaleDateString()}</TableCell>
                <TableCell>
                  {caseItem.dateOfAccident} at {caseItem.timeOfAccident?.substring(0, 5)}
                </TableCell>
                <TableCell>
                  {caseItem.accidentLocation ? (
                    `${caseItem.accidentLocation.latitude?.toFixed?.(6) || 'N/A'}, 
                    ${caseItem.accidentLocation.longitude?.toFixed?.(6) || 'N/A'}`
                  ) : 'N/A'}
                </TableCell>
                <TableCell sx={{ maxWidth: 300 }}>
                  {caseItem.accidentDescription || 'No description'}
                </TableCell>
                <TableCell>
                  <Chip 
                    label={caseItem.status} 
                    color={statusColors[caseItem.status] || 'default'}
                    variant="outlined"
                  />
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={7}>
                  <Collapse in={expandedCase === caseItem.id} timeout="auto" unmountOnExit>
                    <Box sx={{ margin: 1 }}>
                      <Typography variant="h6" gutterBottom component="div">
                        Suspect Vehicles
                      </Typography>
                      {caseItem.suspects?.length > 0 ? (
                        <List dense>
                          {caseItem.suspects.map((suspect, index) => (
                            <React.Fragment key={index}>
                              <ListItem>
                                <Avatar sx={{ mr: 2 }}>
                                  <CarIcon />
                                </Avatar>
                                <ListItemText
                                  primary={`Vehicle ${suspect.vehicleId}`}
                                  secondary={
                                    <>
                                      <Typography component="span" variant="body2" display="block">
                                        Probability: {suspect.probability}% match
                                      </Typography>
                                      <Typography component="span" variant="body2" display="block">
                                        Distance: {(suspect.distance * 1000).toFixed(0)} meters away
                                      </Typography>
                                      <Typography component="span" variant="body2" display="block">
                                        Time: {suspect.time} ({suspect.timeDiff?.toFixed(1) || '0'} min difference)
                                      </Typography>
                                      <Typography component="span" variant="body2" display="block">
                                        Location: {suspect.location?.lat?.toFixed(6) || 'N/A'}, {suspect.location?.lng?.toFixed(6) || 'N/A'}
                                      </Typography>
                                    </>
                                  }
                                />
                              </ListItem>
                              {index < caseItem.suspects.length - 1 && <Divider />}
                            </React.Fragment>
                          ))}
                        </List>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          No suspects identified for this case
                        </Typography>
                      )}
                    </Box>
                  </Collapse>
                </TableCell>
              </TableRow>
            </React.Fragment>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default UserDashboard;