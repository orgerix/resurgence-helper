import  { Rarity, RelicReward} from './Types.ts'




enum Refinement {
    Intact="intact",
    Flawless="flawless",
    Radiant="radiant",
}

enum RunType {
    By2 = "2b2",
    By4 = "4b4",
}

class RunMethod {
    relicsPerRun: number;
    runsPerCycle: number;
}

class Run {
    refinement: Refinement;
    runMethod: RunMethod;

    constructor(refinement: Refinement, runMethod: RunMethod) {
        this.refinement = refinement;
        this.runMethod = runMethod;
    }

    asString() : string {
        const result = `${this.runMethod.relicsPerRun}b${this.runMethod.relicsPerRun}${this.refinement[0]}`
        return result;
    }

    nbOffcycleRelicsPerRun() {
        return 4 - this.runMethod.relicsPerRun;
    }
}


const probabilities = new Map<Refinement, Map<Rarity, number>>([
    [Refinement.Intact, new Map<Rarity, number>([[Rarity.Gold, 0.02], [Rarity.Silver, 0.11], [Rarity.Bronze, 0.76/3]])],
    [Refinement.Flawless, new Map<Rarity, number>([[Rarity.Gold, 0.06], [Rarity.Silver, 0.17], [Rarity.Bronze, 0.60/3]])],
    [Refinement.Radiant, new Map<Rarity, number>([[Rarity.Gold, 0.10], [Rarity.Silver, 0.20], [Rarity.Bronze, 0.50/3]])],
])

const runMethods = new Map<RunType, RunMethod>([
    [RunType.By2, {relicsPerRun:2, runsPerCycle:2}],
    [RunType.By4, {relicsPerRun:4, runsPerCycle:1}]
]) 

function parseRunMethod(runMethod: string): Run {
    let refinement: Refinement | undefined;
    let method: RunMethod | undefined;
    switch (runMethod[0]) {
        case "2":
            method = runMethods.get(RunType.By2);
            break;
        case "4":
            method = runMethods.get(RunType.By4);
            break;
    }
    switch (runMethod[runMethod.length-1]) {
        case "i":
            refinement = Refinement.Intact;
            break;
        case "f":
            refinement = Refinement.Flawless;
            break;
        case "r":
            refinement = Refinement.Radiant;
            break;
    }
    if( refinement === undefined || method === undefined) {
        throw runMethod;
    }
    const result = new Run(refinement, method);
    if (runMethod !== result.asString()) {
        console.error("Bad parsing", result, result.asString(), runMethod);
    }
    return result;
}


function computeProbabilities(run: Run, rewards: RelicReward[], offcycle: string | undefined): number[] {
    const proba = probabilities.get(run.refinement);
    if (proba === undefined) {
        console.log("Undefined refinement", run.refinement);
        throw run.refinement;
    }
    const result: number[] = [];
    let cumulatedProba = 0;
    let cumulatedCompositeProba = 0;
    let handleOffcycle = false;
    for (let i=0; i<rewards.length; i++) {
        handleOffcycle = handleOffcycle || (offcycle === rewards[i].item.id);
        const singleProbability = proba.get(rewards[i].rarity);
        if (singleProbability === undefined) {
            console.log("Undefined proba", proba, rewards[i].rarity);
            throw "Error";
        }
        const compositeProbability = 1-(1-singleProbability - cumulatedProba)**run.runMethod.relicsPerRun - cumulatedCompositeProba;
        result.push(compositeProbability*(handleOffcycle ? 0.98**run.nbOffcycleRelicsPerRun() : 1));
        cumulatedProba += singleProbability;
        cumulatedCompositeProba += compositeProbability;
    }  
    return result.map(n => n * run.runMethod.runsPerCycle)
}

export {computeProbabilities, Run, parseRunMethod}