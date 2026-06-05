import type { ScoredStream } from "@/lib/streams/types";

const EMPTY = new Set<string>();

export function useTopStreamVerify(_: {
  enabled: boolean;
  candidates: ScoredStream[];
}): { verifiedUrls: Set<string>; rejectedUrls: Set<string>; verifying: boolean } {
  return { verifiedUrls: EMPTY, rejectedUrls: EMPTY, verifying: false };
}
