
export interface HarvesterMemory extends CreepMemory { }

export class Harvester extends Creep {
    public memory: HarvesterMemory;

    public run() {
        if(this.store.getFreeCapacity() > 0) {
            var sources = this.room.find(FIND_SOURCES);
            if(this.harvest(sources[0]) == ERR_NOT_IN_RANGE) {
                this.moveTo(sources[0], {visualizePathStyle: {stroke: '#ffaa00'}});
            }
        }
        else {
            var targets = this.room.find(FIND_STRUCTURES, {
                    filter: (structure) => {
                        return (structure.structureType == STRUCTURE_EXTENSION || structure.structureType == STRUCTURE_SPAWN) &&
                            structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
                    }
            });

            let success = false;
            if(targets.length > 0) {
                if(this.transfer(targets[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    this.moveTo(targets[0], {visualizePathStyle: {stroke: '#ffffff'}});
                    success = true;
                }
            }

            if(!success) {
                this.moveTo(44, 15, {visualizePathStyle: {stroke: '#ff0000'}});
            }
        }
    }
}