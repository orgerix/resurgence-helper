import { parseRunMethod, Run } from "./Math";
import { Relic } from "./Types";



class RelicState {
    run: Run | undefined;
    amount: number | undefined;
    relic: Relic;
    positions: Map<string, number>;
    offcycle: string | undefined;

    constructor(relic: Relic) {
        this.relic = relic;
        this.positions = new Map<string, number>(relic.rewards.map((r, i) => [r.item.id, i]));
    }
}

export default RelicState