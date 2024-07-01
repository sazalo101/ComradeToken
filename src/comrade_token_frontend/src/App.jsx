import React, { useState, useEffect } from 'react';
import { comrade_token_backend } from 'declarations/comrade_token_backend';
import { AuthClient } from '@dfinity/auth-client';
import { Principal } from '@dfinity/principal';
import { 
  Container, 
  Typography, 
  Button, 
  TextField, 
  Paper, 
  Box, 
  Grid,
  CircularProgress,
  Snackbar,
  Alert
} from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { motion } from 'framer-motion'; // Import motion from framer-motion
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import SendIcon from '@mui/icons-material/Send';
import LogoutIcon from '@mui/icons-material/Logout';

const theme = createTheme({
  palette: {
    primary: {
      main: '#4a90e2',
    },
    secondary: {
      main: '#f50057',
    },
  },
});

const ComradeToken = () => {
  const [principal, setPrincipal] = useState(localStorage.getItem('principal') || '');
  const [balance, setBalance] = useState(Number(localStorage.getItem('balance')) || 0);
  const [canMint, setCanMint] = useState(false);
  const [transferAmount, setTransferAmount] = useState('');
  const [transferTo, setTransferTo] = useState('');
  const [totalSupply, setTotalSupply] = useState(0);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [authenticated, setAuthenticated] = useState(false);
  const [authClient, setAuthClient] = useState(null);

  useEffect(() => {
    const initAuth = async () => {
      const client = await AuthClient.create();
      setAuthClient(client);
      if (await client.isAuthenticated()) {
        handleAuthenticated(client);
      } else {
        setAuthenticated(false);
      }
    };

    if (!authenticated) {
      initAuth();
    }
  }, [authenticated]);

  const handleAuthenticated = async (client) => {
    const identity = client.getIdentity();
    const principal = identity.getPrincipal().toText();
    setPrincipal(principal);
    localStorage.setItem('principal', principal);
    await checkBalance(principal);
    await checkCanMint(principal);
    await getTotalSupply();
    setAuthenticated(true);
  };

  const login = async () => {
    try {
      if (!authClient) {
        const client = await AuthClient.create();
        setAuthClient(client);
      }
      await authClient.login({
        identityProvider: "https://identity.ic0.app",
        onSuccess: () => {
          handleAuthenticated(authClient);
        },
      });
    } catch (error) {
      console.error("Error logging in:", error);
      showSnackbar('Error logging in', 'error');
    }
  };

  const logout = async () => {
    try {
      await authClient.logout();
      setPrincipal('');
      setBalance(0);
      setCanMint(false);
      setAuthenticated(false);
      localStorage.removeItem('principal');
      localStorage.removeItem('balance');
    } catch (error) {
      console.error("Error logging out:", error);
      showSnackbar('Error logging out', 'error');
    }
  };

  const checkBalance = async (principalId = principal) => {
    setLoading(true);
    try {
      const result = await comrade_token_backend.balanceOf(Principal.fromText(principalId));
      const balance = Number(result);
      setBalance(balance);
      localStorage.setItem('balance', balance);
    } catch (error) {
      console.error("Error checking balance:", error);
      showSnackbar('Error checking balance', 'error');
    }
    setLoading(false);
  };

  const checkCanMint = async (principalId = principal) => {
    try {
      const result = await comrade_token_backend.canMint(Principal.fromText(principalId));
      setCanMint(result);
    } catch (error) {
      console.error("Error checking mint ability:", error);
      showSnackbar('Error checking mint ability', 'error');
    }
  };

  const mintTokens = async () => {
    setLoading(true);
    try {
      const result = await comrade_token_backend.mint();
      if ('ok' in result) {
        const mintedAmount = Number(result.ok);
        const newBalance = balance + mintedAmount;
        setBalance(newBalance);
        localStorage.setItem('balance', newBalance);
        showSnackbar(`Successfully minted ${mintedAmount} tokens!`, 'success');
        setCanMint(false);
        await getTotalSupply();
      } else {
        showSnackbar('Error minting tokens: ' + result.err, 'error');
      }
    } catch (error) {
      console.error("Error minting tokens:", error);
      showSnackbar('Error minting tokens', 'error');
    }
    setLoading(false);
  };

  const transferTokens = async () => {
    setLoading(true);
    try {
      const result = await comrade_token_backend.transfer(Principal.fromText(transferTo), BigInt(transferAmount));
      if ('ok' in result) {
        showSnackbar('Tokens transferred successfully!', 'success');
        await checkBalance();
        setTransferAmount('');
        setTransferTo('');
      } else {
        showSnackbar('Error transferring tokens: ' + result.err, 'error');
      }
    } catch (error) {
      console.error("Error transferring tokens:", error);
      showSnackbar('Error transferring tokens', 'error');
    }
    setLoading(false);
  };

  const getTotalSupply = async () => {
    try {
      const result = await comrade_token_backend.getTotalSupply();
      setTotalSupply(Number(result));
    } catch (error) {
      console.error("Error getting total supply:", error);
      showSnackbar('Error getting total supply', 'error');
    }
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <ThemeProvider theme={theme}>
      <Container maxWidth="sm">
        {!authenticated ? (
          <Paper component={motion.div} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} elevation={3} sx={{ p: 4, mt: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom align="center">
              Login to Comrade Token Wallet
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <Button variant="contained" color="primary" onClick={login} component={motion.button} whileHover={{ scale: 1.1 }}>
                Login with Internet Identity
              </Button>
            </Box>
          </Paper>
        ) : (
          <Paper component={motion.div} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} elevation={3} sx={{ p: 4, mt: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom align="center">
              Comrade Token Wallet
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
              <AccountBalanceWalletIcon sx={{ fontSize: 40, mr: 1 }} color="primary" />
              <Typography variant="h5" component="div">
                {balance} CT
              </Typography>
            </Box>
            <Typography variant="body2" align="center" gutterBottom>
              Your Principal: {principal}
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Button 
                  fullWidth 
                  variant="contained" 
                  color="secondary" 
                  onClick={mintTokens} 
                  disabled={!canMint || loading}
                  component={motion.button}
                  whileHover={{ scale: 1.1 }}
                >
                  {canMint ? "Mint Tokens" : "Minting Cooldown"}
                </Button>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Transfer Tokens
                </Typography>
                <TextField
                  fullWidth
                  label="Recipient Principal"
                  variant="outlined"
                  value={transferTo}
                  onChange={(e) => setTransferTo(e.target.value)}
                  margin="normal"
                  InputProps={{
                    component: motion.input,
                    whileHover: { scale: 1.1 },
                  }}
                />
                <TextField
                  fullWidth
                  label="Amount to transfer"
                  variant="outlined"
                  type="number"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  margin="normal"
                  InputProps={{
                    component: motion.input,
                    whileHover: { scale: 1.1 },
                  }}
                />
                <Button 
                  fullWidth 
                  variant="contained" 
                  onClick={transferTokens} 
                  disabled={!transferTo || !transferAmount || loading}
                  startIcon={<SendIcon />}
                  component={motion.button}
                  whileHover={{ scale: 1.1 }}
                >
                  Transfer
                </Button>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body1" gutterBottom>
                  Total Supply: {totalSupply} CT
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Button 
                  fullWidth 
                  variant="outlined" 
                  onClick={logout}
                  startIcon={<LogoutIcon />}
                  disabled={loading}
                  component={motion.button}
                  whileHover={{ scale: 1.1 }}
                >
                  Logout
                </Button>
              </Grid>
            </Grid>
          </Paper>
        )}
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <CircularProgress />
          </Box>
        )}
        <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar}>
          <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </ThemeProvider>
  );
};

export default ComradeToken;
