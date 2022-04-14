import { BaseScreep, ScreepState } from "$creeps/BaseScreep";
import { Builder } from "$creeps/Builder";
import { HarvesterRunner } from "$creeps/HarvesterRunner";
import { Hauler } from "$creeps/Hauler";
import { Redistributor } from "$creeps/Redistributor";
import { StaticHarvester } from "$creeps/StaticHarvester";
import { Upgrader } from "$creeps/Upgrader";
import { ContainerData } from "controllers/MapInfoController";

export class Global {
    public static CreateScreep(screep: Creep) : BaseScreep {
         switch (screep.memory.role) {
             case 'Builder':
                return new Builder(screep);
            case 'HarvesterRunner':
                return new HarvesterRunner(screep);
            case 'Upgrader':
                return  new Upgrader(screep);
            case 'StaticHarvester':
                return new StaticHarvester(screep);
            case 'Hauler':
                return new Hauler(screep);
            case 'Redistributor':
                return new Redistributor(screep);
            default:
                 break;
         }
    }
}

declare global {
    interface Memory {
        uuid: number;
        containerData: ContainerData;
        energyStates: {[key: string] : number[]};
        // ....
    }

    interface CreepMemory {
        state: ScreepState;
        prevState: ScreepState;
        role: string;
        origin: string;
        target : Id<RoomObject>;
        // ....
    }

    interface SourceUserMemory extends CreepMemory {
        sourceId: Id<Source>;
    }

    
};
