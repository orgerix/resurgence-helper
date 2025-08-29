enum Rarity {
  Bronze,
  Silver,
  Gold,
}

enum Era {
    Lith="Lith",
    Meso="Meso",
    Neo="Neo",
    Axi="Axi",
}

class RelicReward {
    rarity: Rarity;
    item: Item;
}

class Item {
    id: string;
    name: string;
    set: string|undefined;
    amount: number

    constructor(name:string) {
        this.id = (Math.random() + 1).toString(36).substring(7);
        if(name.startsWith("2x ")) {
            this.name = name.substring(3);
            this.amount = 2;
        } else {
            this.name = name;
            this.amount = 1;
        } 
        const primeIndex = this.name.indexOf("Prime");
        if (primeIndex > 0) {
            this.set = this.name.substring(0, primeIndex + "Prime".length)
        }
    }
}

class Forma {
    amount: number;
}

class Relic {
    name: string;
    era: Era;
    rewards: RelicReward[];
}

class DataParser {

    parseEra(relicName: string): Era | undefined {
        switch (relicName.substring(0, relicName.indexOf(" "))) {
            case "Lith":
                return Era.Lith;
            case "Meso":
                return Era.Meso;
            case "Neo":
                return Era.Neo;
            case "Axi":
                return Era.Axi
            default:
                return undefined;
        }
    }

    parseItem(item) : Item  {
        return new Item(item.name);
    }

    getRarity(chance:number) : Rarity {
        if(chance === 2) {
            return Rarity.Gold;
        } else if(chance === 11) {
            return Rarity.Silver;
        } else {
            return Rarity.Bronze;
        }
    }

    parseRelic(element) : Relic | undefined {
        const era = this.parseEra(element.name);
        if (era === undefined) {
            return undefined;
        }
        const chunks = element.name.split(" ");
        const name = chunks[0] + " " + chunks[1];
        const rewards = element.rewards.map(r => {
            const rarity = this.getRarity(r.chance);
            const item = this.parseItem(r.item);
            return {rarity:rarity, item:item};
        })  
        return {name:name, era:era, rewards:rewards}
    }

    parse(data) : Map<string, Relic> {
        const result = new Map<string, Relic>();
        data.forEach(element => {
            const relic = this.parseRelic(element);
            if (relic !== undefined) {
                result.set(relic.name, relic);
            }
        });
        return result;
    }
}

async  function loadRelics(): Promise<Map<string, Relic>> {
    const response = await fetch("https://api.warframestat.us/items/search/Relics/?by=category")
    const json = await response.json();
    return new DataParser().parse(json);
}

export {loadRelics, Relic, RelicReward, Item, Forma, Rarity};