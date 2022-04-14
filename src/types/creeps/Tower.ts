import { ScreepState, SourceUserScreep } from "./BaseScreep";


export class Tower {
    _tower: StructureTower;
    public get tower() : StructureTower {
        return this._tower;
    }
    
    public set tower(v : StructureTower) {
        this._tower = v;
    }

    constructor(tower: StructureTower) {
        this.tower = tower;
    }

    public prepare(){

    }

    public update() {
        var hostiles = this.tower.room.find(FIND_HOSTILE_CREEPS);
        if(hostiles.length > 0) {
            this.tower.attack(hostiles[0]);
        }else{
            var targets = this.tower.room.find(FIND_STRUCTURES, {
                filter: (structure) => {
                    return (structure.structureType != STRUCTURE_RAMPART && structure.structureType != STRUCTURE_WALL && structure.hits < structure.hitsMax);
                }
            });
            if (targets.length) {
                this.tower.repair(targets[0]);
            }else{
                targets = this.tower.room.find(FIND_STRUCTURES, {
                    filter: (structure) => {
                        return ((structure.structureType == STRUCTURE_RAMPART && structure.hits < structure.hitsMax / 100) || (structure.structureType == STRUCTURE_WALL && structure.hits < structure.hitsMax / 2500));
                    }
                });
               
                if(targets.length) {
                    targets.sort((a,b) => (a.hits > b.hits) ? 1 : ((b.hits > a.hits) ? -1 : 0))
                    this.tower.repair(targets[0]);
                }
              
            }
            

        }

    }
}