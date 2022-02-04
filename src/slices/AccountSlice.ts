import { BigNumber, BigNumberish, ethers } from "ethers";
import { addresses } from "../constants";
import { abi as ierc20Abi } from "../abi/IERC20.json";
import { abi as AuctionAbi } from "../abi/auction.json";
import { abi as sOHMv2 } from "../abi/sOhmv2.json";
import { abi as fuseProxy } from "../abi/FuseProxy.json";
import { abi as wsOHM } from "../abi/wsOHM.json";

import { bnToNum, setAll } from "../helpers";

import { createAsyncThunk, createSelector, createSlice } from "@reduxjs/toolkit";
import { RootState } from "src/store";
import { BondHelper } from "src/helpers/BondHelper";
import { IBaseAddressAsyncThunk, ICalcUserBondDetailsAsyncThunk } from "./interfaces";
import { FuseProxy, IERC20, SOhmv2, WsOHM } from "src/typechain";

interface IUserBalances {
  balances: {
    ohm: string;
    sohm: string;
    fsohm: string;
    wsohm: string;
    wsohmAsSohm: string;
    pool: string;
  };
}

export const getBalances = createAsyncThunk(
  "account/getBalances",
  async ({ address, networkID, provider }: IBaseAddressAsyncThunk) => {
    // @todo: load FRAX balance
    const fraxContract = new ethers.Contract(addresses[networkID].frax as string, ierc20Abi, provider) as IERC20;
    const [fraxBalance] = await Promise.all([fraxContract.balanceOf(address)]);
    // const ohmContract = new ethers.Contract(addresses[networkID].OHM_ADDRESS as string, ierc20Abi, provider) as IERC20;
    // const ohmBalance = await ohmContract.balanceOf(address);
    // const sohmContract = new ethers.Contract(
    //   addresses[networkID].SOHM_ADDRESS as string,
    //   ierc20Abi,
    //   provider,
    // ) as IERC20;
    // const sohmBalance = await sohmContract.balanceOf(address);
    // const wsohmContract = new ethers.Contract(addresses[networkID].WSOHM_ADDRESS as string, wsOHM, provider) as WsOHM;
    // const wsohmBalance = await wsohmContract.balanceOf(address);
    // // NOTE (appleseed): wsohmAsSohm is wsOHM given as a quantity of sOHM
    // const wsohmAsSohm = await wsohmContract.wOHMTosOHM(wsohmBalance);
    // const poolTokenContract = new ethers.Contract(
    //   addresses[networkID].PT_TOKEN_ADDRESS as string,
    //   ierc20Abi,
    //   provider,
    // ) as IERC20;
    // const poolBalance = await poolTokenContract.balanceOf(address);

    // let fsohmBalance = BigNumber.from(0);
    // for (const fuseAddressKey of ["FUSE_6_SOHM", "FUSE_18_SOHM"]) {
    //   if (addresses[networkID][fuseAddressKey]) {
    //     const fsohmContract = new ethers.Contract(
    //       addresses[networkID][fuseAddressKey] as string,
    //       fuseProxy,
    //       provider.getSigner(),
    //     ) as FuseProxy;
    //     // fsohmContract.signer;
    //     const balanceOfUnderlying = await fsohmContract.callStatic.balanceOfUnderlying(address);
    //     fsohmBalance = balanceOfUnderlying.add(fsohmBalance);
    //   }
    // }

    return {
      balances: {
        frax: Number(fraxBalance.toString()) / Math.pow(10, 18),
        // ohm: ethers.utils.formatUnits(ohmBalance, "gwei"),
        // sohm: ethers.utils.formatUnits(sohmBalance, "gwei"),
        // fsohm: ethers.utils.formatUnits(fsohmBalance, "gwei"),
        // wsohm: ethers.utils.formatEther(wsohmBalance),
        // wsohmAsSohm: ethers.utils.formatUnits(wsohmAsSohm, "gwei"),
        // pool: ethers.utils.formatUnits(poolBalance, "gwei"),
      },
    };
  },
);

interface IUserAccountDetails {
  staking: {
    ohmStake: number;
    ohmUnstake: number;
  };
  wrapping: {
    sohmWrap: number;
    wsohmUnwrap: number;
  };
}

export const loadAccountDetails = createAsyncThunk(
  "account/loadAccountDetails",
  async ({ networkID, provider, address }: IBaseAddressAsyncThunk, { dispatch }) => {
    const fraxContract = new ethers.Contract(addresses[networkID].frax, ierc20Abi, provider);
    const fraxAllowance = await fraxContract.allowance(address, addresses[networkID].PhantomAuction);

    const auctionContract = new ethers.Contract(addresses[networkID].PhantomAuction as string, AuctionAbi, provider);
    const tokensClaimable = await auctionContract.tokensClaimable(address);
    // const ohmContract = new ethers.Contract(addresses[networkID].OHM_ADDRESS as string, ierc20Abi, provider) as IERC20;
    // const stakeAllowance = await ohmContract.allowance(address, addresses[networkID].STAKING_HELPER_ADDRESS);

    // const sohmContract = new ethers.Contract(addresses[networkID].SOHM_ADDRESS as string, sOHMv2, provider) as SOhmv2;
    // const unstakeAllowance = await sohmContract.allowance(address, addresses[networkID].STAKING_ADDRESS);
    // const poolAllowance = await sohmContract.allowance(address, addresses[networkID].PT_PRIZE_POOL_ADDRESS);
    // const wrapAllowance = await sohmContract.allowance(address, addresses[networkID].WSOHM_ADDRESS);

    // const wsohmContract = new ethers.Contract(addresses[networkID].WSOHM_ADDRESS as string, wsOHM, provider) as WsOHM;
    // const unwrapAllowance = await wsohmContract.allowance(address, addresses[networkID].WSOHM_ADDRESS);

    await dispatch(getBalances({ address, networkID, provider }));

    return {
      auction: {
        fraxAllowance: bnToNum(fraxAllowance) / Math.pow(10, 18),
        tokensClaimable: bnToNum(tokensClaimable) / Math.pow(10, 18),
      },
      // staking: {
      //   ohmStake: +stakeAllowance,
      //   ohmUnstake: +unstakeAllowance,
      // },
      // wrapping: {
      //   ohmWrap: +wrapAllowance,
      //   ohmUnwrap: +unwrapAllowance,
      // },
      // pooling: {
      //   sohmPool: +poolAllowance,
      // },
    };
  },
);

export interface IUserBondDetails {
  nonce: number;
  allowance: number;
  interestDue: number;
  vestsAtTimestamp: number;
  isClaimable: boolean;
}

export const calculateUserBondDetails = createAsyncThunk(
  "account/calculateUserBondDetails",
  async ({ address, bond, nonce, networkID, provider }: ICalcUserBondDetailsAsyncThunk) => {
    if (!address) {
      return {
        bond: "",
        displayName: "",
        bondIconSvg: "",
        isAvailable: false,
        isLP: false,
        nonce: 0,
        allowance: 0,
        balance: "0",
        interestDue: 0,
        vestsAtTimestamp: 0,
        isClaimable: false,
      };
    }

    // Calculate bond details.
    const bondHelper = new BondHelper(networkID, provider);
    const reserveContract = bond.getContractForReserve(networkID, provider);

    const interestDue = await bondHelper.remainingPayoutFor(address, nonce);
    const vestsAtTimestamp = await bondHelper.vestsAtTimestamp(address, nonce);
    const blockNo = await provider.getBlockNumber();
    const block = await provider.getBlock(blockNo);
    const isClaimable = vestsAtTimestamp >= block.timestamp;

    let allowance,
      balance = BigNumber.from(0);
    allowance = await reserveContract.allowance(address, addresses[networkID].PhantomTreasury);
    balance = await reserveContract.balanceOf(address);
    // formatEthers takes BigNumber => String
    const balanceVal = ethers.utils.formatEther(balance);
    // balanceVal should NOT be converted to a number. it loses decimal precision



    return {
      bond: bond.name,
      displayName: bond.displayName,
      bondIconSvg: bond.bondIconSvg,
      isAvailable: true,
      isLP: bond.isLP,
      nonce: nonce,
      allowance: Number(allowance.toString()),
      balance: balanceVal,
      interestDue: interestDue,
      vestsAtTimestamp: vestsAtTimestamp,
      isClaimable: isClaimable,
    };
  },
);

interface IAccountSlice extends IUserAccountDetails, IUserBalances {
  bonds: { [key: number]: IUserBondDetails };
  loading: boolean;
}

const initialState: IAccountSlice = {
  loading: false,
  bonds: {},
  balances: { ohm: "", sohm: "", wsohmAsSohm: "", wsohm: "", fsohm: "", pool: "" },
  staking: { ohmStake: 0, ohmUnstake: 0 },
  wrapping: { sohmWrap: 0, wsohmUnwrap: 0 },
};

const accountSlice = createSlice({
  name: "account",
  initialState,
  reducers: {
    fetchAccountSuccess(state, action) {
      setAll(state, action.payload);
    },
  },
  extraReducers: builder => {
    builder
      .addCase(loadAccountDetails.pending, state => {
        state.loading = true;
      })
      .addCase(loadAccountDetails.fulfilled, (state, action) => {
        setAll(state, action.payload);
        state.loading = false;
      })
      .addCase(loadAccountDetails.rejected, (state, { error }) => {
        state.loading = false;
        console.log(error);
      })
      .addCase(getBalances.pending, state => {
        state.loading = true;
      })
      .addCase(getBalances.fulfilled, (state, action) => {
        setAll(state, action.payload);
        state.loading = false;
      })
      .addCase(getBalances.rejected, (state, { error }) => {
        state.loading = false;
        console.log(error);
      })
      .addCase(calculateUserBondDetails.pending, state => {
        state.loading = true;
      })
      .addCase(calculateUserBondDetails.fulfilled, (state, action) => {
        if (!action.payload) return;
        const nonce = action.payload.nonce;
        state.bonds[nonce] = action.payload;
        state.loading = false;
      })
      .addCase(calculateUserBondDetails.rejected, (state, { error }) => {
        state.loading = false;
        console.log(error);
      });
  },
});

export default accountSlice.reducer;

export const { fetchAccountSuccess } = accountSlice.actions;

const baseInfo = (state: RootState) => state.account;

export const getAccountState = createSelector(baseInfo, account => account);
