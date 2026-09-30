/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
declare module 'swr' {
  export default function useSWR<Data = any, Error = any>(...args: any[]): any;
  export const SWRConfig: any;
}

declare module '@stellar/freighter-api' {
  export const isConnected: any;
  export const getPublicKey: any;
  export const signTransaction: any;
  export const getNetwork: any;
  export const signBlob: any;
  export const getAddress: any;
  export const isAllowed: any;
  export const setAllowed: any;
}
