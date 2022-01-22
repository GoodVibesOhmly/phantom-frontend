import { Box, Grid, Paper, SvgIcon, Typography, useTheme, Button } from "@material-ui/core";
import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useWeb3Context } from "../../hooks/web3Context";
import { ReactComponent as DotIcon } from "./../../assets/icons/dot.svg";
import { txnButtonText } from "src/slices/PendingTxnsSlice";
import { claimTokens } from "../../slices/AuctionSlice";
import AuctionController from "./AuctionController";
import LineChartAuction from "./LineChartAuction";
import { durationAsString } from "../../helpers";

const AuctionDetails = ({
  isLoading,
  auctionStatus,
  startPrice,
  minimumPrice,
  tokenPrice,
  totalTokens,
  onCommitTokens,
  tokensClaimable,
  totalTokensCommitted,
  commitedFrax,
  fraxBalance,
  startTime,
}) => {
  const theme = useTheme();
  const { address, connect, provider, chainID } = useWeb3Context();
  const dispatch = useDispatch();
  const remainingTokensShare = 100 - (totalTokensCommitted / totalTokens) * 100;
  const [timeLeft, setTimeLeft] = useState(durationAsString(new Date().getTime(), startTime * 1000));
  const pendingTransactions = useSelector(state => state.pendingTransactions);

  const data = [
    {
      name: "AUCTION START",
      "AUCTION PRICE": startPrice,
    },
    {
      name: "",
      "AUCTION PRICE": tokenPrice,
    },
    {
      name: "AUCTION END",
      "AUCTION PRICE": minimumPrice,
    },
  ];

  const onClaimTokens = () => {
    dispatch(claimTokens({ provider, networkID: chainID, address }));
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(durationAsString(new Date().getTime(), startTime * 1000));
    }, 1000);
    return () => clearInterval(interval);
  });

  return (
    <Box
      component={Paper}
      sx={{
        boxShadow: "0px 0px 64px rgba(119, 34, 252, 0.1)",
        borderRadius: "12px",
        minHeight: "100%",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        backgroundColor: "#161429",
      }}
    >
      {address && !isLoading ? (
        <>
          <Grid container spacing={2} justifyContent="flex-start" style={{ padding: theme.spacing(4) }}>
            <Grid item xs={6} md={3}>
              <Typography variant="body1" color="textSecondary" style={{ marginBottom: theme.spacing(1) }}>
                AMOUNT FOR SALE
              </Typography>
              <Typography variant="body1">
                {new Intl.NumberFormat("en-US").format(auctionStatus === "notstarted" ? 75000 : totalTokens)} aPHM
              </Typography>
            </Grid>
            <Grid item xs={6} md={3}>
              <Typography variant="body1" color="textSecondary" style={{ marginBottom: theme.spacing(1) }}>
                RAISED
              </Typography>
              <Typography variant="body1">{new Intl.NumberFormat("en-US").format(commitedFrax)} FRAX</Typography>
            </Grid>
            <Grid item xs={6} md={3}>
              <Typography variant="body1" color="textSecondary" style={{ marginBottom: theme.spacing(1) }}>
                REMAINING
              </Typography>
              {auctionStatus === "notstarted" ? (
                <Typography variant="body1">{new Intl.NumberFormat("en-US").format(150000000)} FRAX</Typography>
              ) : (
                <Typography variant="body1">{Math.round(remainingTokensShare * 100) / 100}%</Typography>
              )}
            </Grid>
            <Box
              component={Grid}
              item
              xs={6}
              md={3}
              sx={{
                textAlign: "right",
              }}
            >
              <Typography variant="body1" color="textSecondary" style={{ marginBottom: theme.spacing(1) }}>
                STATUS
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  textAlign: "right",
                  justifyContent: "flex-end",
                }}
              >
                <SvgIcon
                  style={{
                    color: auctionStatus === "ongoing" ? "green" : auctionStatus === "finished" ? "#7722FC" : "#616161",
                  }}
                >
                  <DotIcon />
                </SvgIcon>
                <Typography variant="body1">
                  {auctionStatus === "ongoing" ? "Ongoing" : auctionStatus === "finished" ? "Finished" : "Not started"}{" "}
                </Typography>
              </Box>
            </Box>
          </Grid>
          {auctionStatus === "ongoing" && startPrice ? (
            <Box
              sx={{
                width: "100%",
                minHeight: "400px",
                backgroundColor: "#000000",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: theme.spacing(2),
                marginTop: theme.spacing(2),
              }}
            >
              <LineChartAuction data={data} />
            </Box>
          ) : (
            <Box
              sx={{
                width: "100%",
                minHeight: "75vh",
                background: "radial-gradient(50% 50% at 50% 50%, #1D0443 0%, #010101 100%)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "10px",
                textAlign: "center",
              }}
            >
              {auctionStatus === "notstarted" ? (
                <Box>
                  <Typography variant="h6" style={{ color: "#FFC768" }}>
                    THE AUCTION WILL START IN
                  </Typography>
                  {startTime ? (
                    <Typography variant="h1" style={{ fontWeight: "bold" }}>
                      {timeLeft}
                    </Typography>
                  ) : (
                    <Skeleton width="150px" height="60px" />
                  )}
                </Box>
              ) : (
                <>
                  <Box>
                    <Typography variant="h6">THIS AUCTION HAS</Typography>
                    <Typography variant="h1" style={{ fontWeight: "bold" }}>
                      FINISHED
                    </Typography>
                  </Box>
                  <Box sx={{ margin: theme.spacing(4, 0) }}>
                    <Typography variant="h6" style={{ color: "#FFC768", lineHeight: "27px", fontWeight: "bold" }}>
                      Auction finished successfully
                    </Typography>
                    <Typography style={{ lineHeight: "27px" }}>
                      You have {tokensClaimable} aPHM available to claim
                    </Typography>
                  </Box>
                  <Box>
                    <Button
                      variant="contained"
                      color="primary"
                      disabled={tokensClaimable === 0}
                      onClick={onClaimTokens}
                    >
                      {txnButtonText(pendingTransactions, "claim_tokens", "CLAIM")}
                    </Button>
                  </Box>
                </>
              )}
            </Box>
          )}
          {auctionStatus === "ongoing" && (
            <AuctionController tokenPrice={tokenPrice} fraxBalance={fraxBalance} onCommitTokens={onCommitTokens} />
          )}
        </>
      ) : (
        <Box
          sx={{
            width: "100%",
            position: "absolute",
            top: 0,
            left: 0,
            height: "100%",
            background: "radial-gradient(50% 50% at 50% 50%, #1D0443 0%, #010101 100%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
          }}
        >
          <Box sx={{ marginBottom: theme.spacing(2) }}>
            <Typography className="connect-wallet-text" variant="h6">
              Please make sure to connect your wallet first
            </Typography>
          </Box>
          <Button variant="contained" color="primary" className="connect-button" onClick={connect} key={1}>
            Connect Wallet
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default AuctionDetails;
