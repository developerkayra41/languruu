import { ApiProperty } from "@nestjs/swagger";
import { IsIn, IsNotEmpty } from "class-validator";
import { DISCOVERY_SOURCES, DiscoverySource } from "src/_common/enums/DiscoverySource.enum";

export class SetDiscoverySourceRequestDTO {
    @ApiProperty({ enum: DISCOVERY_SOURCES, example: DiscoverySource.FRIEND, nullable: false })
    @IsNotEmpty()
    @IsIn(DISCOVERY_SOURCES)
    source: string;
}
