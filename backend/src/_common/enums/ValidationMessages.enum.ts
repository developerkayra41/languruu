export enum DtoPrefix {
    NAME = 'NAME',
    LASTNAME = 'LASTNAME',
    FULLNAME = 'FULLNAME',
    EMAIL = 'EMAIL',
    PHONE = 'PHONE',
    IDENTITY_NUMBER = 'IDENTITY_NUBMER',
    EMAIL_OR_PHONE = 'EMAIL_OR_PHONE',
    PASSWORD = 'PASSWORD',
    USER_TYPE = 'USER_TYPE',
    USER_ID = 'USER_ID',
    WORD_ID = 'WORD_ID',
    WORDS = 'WORDS',
    WORD_POOL = 'WORD_POOL',
    TERM = 'TERM',
    TRANSLATION = 'TRANSLATION',
    USERNAME = 'USERNAME'
}

export enum WordDtoPrefix {
    WORDS_ID = "WORDS.ID",
    NAME = 'WORDS.NAME',
    DESCRIPTION = 'WORDS.DESCRIPTION',
    WORD_POOL = 'WORDS.WORD_POOL',
    CREATED_AT = 'WORDS.CREATED_AT',
    IS_SHARED = 'WORDS.IS_SHARED',
    SHARE_ID = 'SHARE_ID',
    LANGUAGES = 'LANGUAGES'
}

export enum ValidationType {
    NOT_EMPTY = 'NOT_EMPTY',
    MUST_BU_NUMBER = 'MUST_BE_NUMBER',
    MUST_BU_STRING = 'MUST_BE_STRING',
    MAX_LENGTH = 'MAX_LENGTH',
    MIN_LENGTH = 'MIN_LENGTH',
    NOT_STRONG = 'NOT_STRONG',
    NOT_VALID = 'NOT_VALID',
    MUST_BE_ARRAY = 'MUST_BE_ARRAY',
    IS_DATE_STRING = 'IS_DATE_STRING',
    MUST_BE_BOOLEAN = 'MUST_BE_BOOLEAN',
    MUST_BE_OBJECT = 'MUST_BE_OBJECT',
    MUST_BE_STRING_ARRAY = 'MUST_BE_STRING_ARRAY'
}

export function getValidationMessage(prefix: DtoPrefix | WordDtoPrefix, validationType: ValidationType, ...args: any): string {
    const message = `${prefix}_${validationType}${args.length > 0 ? '|' + args.join('|') : ''}`
    return message
}