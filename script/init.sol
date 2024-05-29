
IAsset[] tokens = [IAsset(token0), IAsset(token1), IAsset(token2), IAsset(token3)];
uint256[] weiAmountsPerToken = [5192296858534827628530496329000000, amntToken1, amntToken2, amntToken3];

uint256[] weiAmountsPerTokenWithoutBpt = [amntToken1, amntToken2, amntToken3]; 

uint256 JOIN_KIND_INIT = 0;
bytes initUserData = abi.encode(JOIN_KIND_INIT, weiAmountsPerTokenWithoutBpt);

IVault.JoinPoolRequest initJoinPoolRequest = IVault.JoinPoolRequest({
    assets: tokens,
    maxAmountsIn: weiAmountsPerToken,
    userData: initUserData,
    fromInternalBalance: false
});