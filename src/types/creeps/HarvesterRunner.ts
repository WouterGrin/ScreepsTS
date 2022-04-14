import { BaseScreep, ScreepState, SourceUserScreep } from "./BaseScreep";

export interface HarvesterRunnerMemory extends SourceUserMemory { 
    spawnerId: Id<StructureSpawn>;
}

export class HarvesterRunner extends SourceUserScreep {
    public get memory() : HarvesterRunnerMemory {
        return this.screep.memory as HarvesterRunnerMemory;
    }
    
    public set memory(v : HarvesterRunnerMemory) {
        this.screep.memory = v;
    }
    
    constructor(screep: Creep) {
        super(screep);
    }

    public prepare(){
        
        super.prepare();
        if(this.memory.state == ScreepState.INITIAL_SPAWN){
            this.changeState(ScreepState.IDLE);
        }
        if (this.memory.state == ScreepState.IDLE) {
            if (Game.time % 10 == 0) {
                this.refreshTargetIds();
                this.recheckState();
            }
        }
        switch (this.memory.state) {
            case ScreepState.IDLE:
                if (this.screep.store.getFreeCapacity(RESOURCE_ENERGY) == 0) {
                    this.changeState(ScreepState.HAULING);
                }
                if (this.screep.store.getFreeCapacity(RESOURCE_ENERGY) != 0) {
                    this.changeState(ScreepState.HARVESTING);
                }
            case ScreepState.HARVESTING:
                if (this.screep.store.getFreeCapacity(RESOURCE_ENERGY) == 0) {
                    this.changeState(ScreepState.HAULING);
                }
                break;
            case ScreepState.HAULING:
                if (this.screep.store.getFreeCapacity(RESOURCE_ENERGY) != 0) {
                    this.changeState(ScreepState.HARVESTING);
                }
                break;
            default:
                break;
        }
    }

    public update() {
        super.update();

        switch (this.memory.state) {
            case ScreepState.IDLE:
                if (this.memory.target == null) {
                    this.screep.moveTo(14, 28, {visualizePathStyle: {stroke: '#ff0000'}});
                }
                break;

            case ScreepState.HAULING:
                if (this.memory.spawnerId != null){
                    let spawner = Game.getObjectById(this.memory.spawnerId);
                    if(this.screep.transfer(spawner, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                        this.screep.moveTo(spawner, {visualizePathStyle: {stroke: '#ffffff'}});
                    }
                    if (this.screep.store[RESOURCE_ENERGY] == 0 || spawner.store.getFreeCapacity(RESOURCE_ENERGY) == 0){
                        this.changeState(ScreepState.IDLE);
                    }
                }else{
                    this.changeState(ScreepState.IDLE);
                }
                break;
            case ScreepState.HARVESTING:
                
                if (this.memory.sourceId != null) {
                    var source = Game.getObjectById(this.memory.sourceId);
                    if(this.screep.harvest(source) == ERR_NOT_IN_RANGE) {
                        this.screep.moveTo(source, {visualizePathStyle: {stroke: '#ffaa00'}});
                    }
                    if (this.screep.store.getFreeCapacity(RESOURCE_ENERGY) == 0) {
                        this.changeState(ScreepState.IDLE);
                    }
                }else{
                    this.changeState(ScreepState.IDLE);
                }
                
                break;
            default:
                break;
        }
    }

    public refreshTargetIds(){
        this.memory.spawnerId = this.checkForSpawner();
        this.memory.sourceId = this.checkForSource();
    }

    public recheckState(){

    }

    public changeState(newState: ScreepState){
        super.changeState(newState);
        if (this.memory.state == ScreepState.IDLE) {
            this.refreshTargetIds();
            this.recheckState();
        }
    } 

    public checkForSpawner() : Id<StructureSpawn>{
        let ret = null;
        var targets = this.screep.room.find(FIND_STRUCTURES, {
            filter: (structure) => {
                return (structure.structureType == STRUCTURE_EXTENSION || structure.structureType == STRUCTURE_SPAWN) &&
                    structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
            }
        });
        if(targets.length) {
            ret = (targets[0] as StructureSpawn).id;
        }
        return ret;
    }

    public checkForSource() : Id<Source>{
        let sources = this.screep.room.find(FIND_SOURCES);
        return sources[0].id;
    }

   
}