export class RoomInfo {
    name:string;
    screepRoles: {[key: string] : number};
    sourceDict: {[key: string] : SourceData};
    structureDict: {[key: string] : Structure[]};

    constructor(_name: string) {
        this.name = _name;
        this.screepRoles = {};
        this.sourceDict = {};
        this.structureDict = {};
    }

    getRoleAmount(role: string): number{
        if (this.screepRoles[role] != null)
            return this.screepRoles[role];
        return 0;
    }
}

export class SourceData{
    id: Id<Source>;
    currentHarvesters : number;
    currentStaticHarvesters : number;
    maxHarvesters: number;
    constructor(_id: Id<Source>) {
        this.id = _id;
        this.currentHarvesters = 0;
        this.currentStaticHarvesters = 0;
        this.maxHarvesters = 0;
    }
}