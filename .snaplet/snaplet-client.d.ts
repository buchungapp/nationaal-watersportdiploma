type ScalarField = {
  name: string
  type: string
}
type ObjectField = ScalarField & {
  relationFromFields: string[]
  relationToFields: string[]
}
type Inflection = {
  modelName?: (name: string) => string
  scalarField?: (field: ScalarField) => string
  parentField?: (
    field: ObjectField,
    oppositeBaseNameMap: Record<string, string>,
  ) => string
  childField?: (
    field: ObjectField,
    oppositeField: ObjectField,
    oppositeBaseNameMap: Record<string, string>,
  ) => string
  oppositeBaseNameMap?: Record<string, string>
}
type Override = {
  __drizzle_migrations?: {
    name?: string
    fields?: {
      id?: string
      hash?: string
      created_at?: string
    }
  }
  actor?: {
    name?: string
    fields?: {
      id?: string
      type?: string
      person_id?: string
      location_id?: string
      created_at?: string
      updated_at?: string
      deleted_at?: string
      _metadata?: string
      location?: string
      person?: string
      media?: string
    }
  }
  audit_log_entries?: {
    name?: string
    fields?: {
      instance_id?: string
      id?: string
      payload?: string
      created_at?: string
      ip_address?: string
    }
  }
  broadcasts?: {
    name?: string
    fields?: {
      id?: string
      channel_id?: string
      inserted_at?: string
      updated_at?: string
      channels?: string
    }
  }
  buckets?: {
    name?: string
    fields?: {
      id?: string
      name?: string
      owner?: string
      created_at?: string
      updated_at?: string
      public?: string
      avif_autodetection?: string
      file_size_limit?: string
      allowed_mime_types?: string
      owner_id?: string
      objects?: string
      s3_multipart_uploads?: string
      s3_multipart_uploads_parts?: string
    }
  }
  category?: {
    name?: string
    fields?: {
      id?: string
      parent_category_id?: string
      handle?: string
      title?: string
      description?: string
      weight?: string
      created_at?: string
      updated_at?: string
      deleted_at?: string
      category?: string
      category?: string
      program_category?: string
    }
  }
  certificate?: {
    name?: string
    fields?: {
      id?: string
      handle?: string
      student_curriculum_id?: string
      location_id?: string
      issued_at?: string
      visible_from?: string
      created_at?: string
      updated_at?: string
      deleted_at?: string
      location?: string
      student_curriculum?: string
      student_completed_competency?: string
    }
  }
  channels?: {
    name?: string
    fields?: {
      id?: string
      name?: string
      inserted_at?: string
      updated_at?: string
      broadcasts?: string
      presences?: string
    }
  }
  competency?: {
    name?: string
    fields?: {
      id?: string
      handle?: string
      title?: string
      type?: string
      weight?: string
      created_at?: string
      updated_at?: string
      deleted_at?: string
      curriculum_competency?: string
    }
  }
  country?: {
    name?: string
    fields?: {
      id?: string
      ar?: string
      bg?: string
      cs?: string
      da?: string
      de?: string
      el?: string
      en?: string
      es?: string
      et?: string
      eu?: string
      fi?: string
      fr?: string
      hu?: string
      it?: string
      ja?: string
      ko?: string
      lt?: string
      nl?: string
      no?: string
      pl?: string
      pt?: string
      ro?: string
      ru?: string
      sk?: string
      sv?: string
      th?: string
      uk?: string
      zh?: string
      'zh-tw'?: string
      alpha_2?: string
      alpha_3?: string
      person?: string
    }
  }
  curriculum?: {
    name?: string
    fields?: {
      id?: string
      program_id?: string
      revision?: string
      started_at?: string
      created_at?: string
      updated_at?: string
      deleted_at?: string
      program?: string
      curriculum_gear_link?: string
      curriculum_module?: string
      student_curriculum?: string
    }
  }
  curriculum_competency?: {
    name?: string
    fields?: {
      id?: string
      curriculum_id?: string
      module_id?: string
      competency_id?: string
      is_required?: string
      requirement?: string
      created_at?: string
      updated_at?: string
      deleted_at?: string
      competency?: string
      curriculum_module?: string
      student_competency_progress?: string
      student_completed_competency?: string
    }
  }
  curriculum_gear_link?: {
    name?: string
    fields?: {
      curriculum_id?: string
      gear_type_id?: string
      created_at?: string
      updated_at?: string
      deleted_at?: string
      curriculum?: string
      gear_type?: string
      student_curriculum?: string
    }
  }
  curriculum_module?: {
    name?: string
    fields?: {
      curriculum_id?: string
      module_id?: string
      created_at?: string
      updated_at?: string
      deleted_at?: string
      curriculum?: string
      module?: string
      curriculum_competency?: string
    }
  }
  degree?: {
    name?: string
    fields?: {
      id?: string
      handle?: string
      title?: string
      rang?: string
      created_at?: string
      updated_at?: string
      deleted_at?: string
      program?: string
    }
  }
  discipline?: {
    name?: string
    fields?: {
      id?: string
      handle?: string
      title?: string
      weight?: string
      created_at?: string
      updated_at?: string
      deleted_at?: string
      program?: string
    }
  }
  flow_state?: {
    name?: string
    fields?: {
      id?: string
      user_id?: string
      auth_code?: string
      code_challenge_method?: string
      code_challenge?: string
      provider_type?: string
      provider_access_token?: string
      provider_refresh_token?: string
      created_at?: string
      updated_at?: string
      authentication_method?: string
      auth_code_issued_at?: string
      saml_relay_states?: string
    }
  }
  gear_type?: {
    name?: string
    fields?: {
      id?: string
      handle?: string
      title?: string
      created_at?: string
      updated_at?: string
      deleted_at?: string
      curriculum_gear_link?: string
      student_curriculum?: string
    }
  }
  identities?: {
    name?: string
    fields?: {
      provider_id?: string
      user_id?: string
      identity_data?: string
      provider?: string
      last_sign_in_at?: string
      created_at?: string
      updated_at?: string
      email?: string
      id?: string
      users?: string
    }
  }
  instances?: {
    name?: string
    fields?: {
      id?: string
      uuid?: string
      raw_base_config?: string
      created_at?: string
      updated_at?: string
    }
  }
  key?: {
    name?: string
    fields?: {
      id?: string
      status?: string
      created?: string
      expires?: string
      key_type?: string
      key_id?: string
      key_context?: string
      name?: string
      associated_data?: string
      raw_key?: string
      raw_key_nonce?: string
      parent_key?: string
      comment?: string
      user_data?: string
      key?: string
      key?: string
      secrets?: string
    }
  }
  location?: {
    name?: string
    fields?: {
      id?: string
      handle?: string
      name?: string
      logo_media_id?: string
      square_logo_media_id?: string
      certificate_media_id?: string
      website_url?: string
      short_description?: string
      _metadata?: string
      created_at?: string
      updated_at?: string
      deleted_at?: string
      media_location_certificate_media_idTomedia?: string
      media_location_logo_media_idTomedia?: string
      media_location_square_logo_media_idTomedia?: string
      actor?: string
      certificate?: string
      media?: string
      person_location_link?: string
      student_competency_progress?: string
    }
  }
  media?: {
    name?: string
    fields?: {
      id?: string
      alt?: string
      mime_type?: string
      status?: string
      type?: string
      size?: string
      object_id?: string
      actor_id?: string
      location_id?: string
      _metadata?: string
      created_at?: string
      updated_at?: string
      deleted_at?: string
      actor?: string
      location?: string
      objects?: string
      location_location_certificate_media_idTomedia?: string
      location_location_logo_media_idTomedia?: string
      location_location_square_logo_media_idTomedia?: string
    }
  }
  mfa_amr_claims?: {
    name?: string
    fields?: {
      session_id?: string
      created_at?: string
      updated_at?: string
      authentication_method?: string
      id?: string
      sessions?: string
    }
  }
  mfa_challenges?: {
    name?: string
    fields?: {
      id?: string
      factor_id?: string
      created_at?: string
      verified_at?: string
      ip_address?: string
      mfa_factors?: string
    }
  }
  mfa_factors?: {
    name?: string
    fields?: {
      id?: string
      user_id?: string
      friendly_name?: string
      factor_type?: string
      status?: string
      created_at?: string
      updated_at?: string
      secret?: string
      users?: string
      mfa_challenges?: string
    }
  }
  migrations?: {
    name?: string
    fields?: {
      id?: string
      name?: string
      hash?: string
      executed_at?: string
    }
  }
  module?: {
    name?: string
    fields?: {
      id?: string
      handle?: string
      title?: string
      weight?: string
      created_at?: string
      updated_at?: string
      deleted_at?: string
      curriculum_module?: string
    }
  }
  objects?: {
    name?: string
    fields?: {
      id?: string
      bucket_id?: string
      name?: string
      owner?: string
      created_at?: string
      updated_at?: string
      last_accessed_at?: string
      metadata?: string
      path_tokens?: string
      version?: string
      owner_id?: string
      buckets?: string
      media?: string
    }
  }
  person?: {
    name?: string
    fields?: {
      id?: string
      user_id?: string
      first_name?: string
      last_name_prefix?: string
      last_name?: string
      date_of_birth?: string
      birth_city?: string
      birth_country?: string
      _metadata?: string
      created_at?: string
      updated_at?: string
      deleted_at?: string
      country?: string
      user?: string
      actor?: string
      person_location_link?: string
      student_curriculum?: string
    }
  }
  person_location_link?: {
    name?: string
    fields?: {
      person_id?: string
      location_id?: string
      status?: string
      permission_level?: string
      linked_at?: string
      revoked_at?: string
      removed_at?: string
      requested_at?: string
      granted_at?: string
      location?: string
      person?: string
    }
  }
  presences?: {
    name?: string
    fields?: {
      id?: string
      channel_id?: string
      inserted_at?: string
      updated_at?: string
      channels?: string
    }
  }
  program?: {
    name?: string
    fields?: {
      id?: string
      handle?: string
      title?: string
      discipline_id?: string
      degree_id?: string
      created_at?: string
      updated_at?: string
      deleted_at?: string
      degree?: string
      discipline?: string
      curriculum?: string
      program_category?: string
    }
  }
  program_category?: {
    name?: string
    fields?: {
      id?: string
      program_id?: string
      category_id?: string
      created_at?: string
      updated_at?: string
      deleted_at?: string
      category?: string
      program?: string
    }
  }
  refresh_tokens?: {
    name?: string
    fields?: {
      instance_id?: string
      id?: string
      token?: string
      user_id?: string
      revoked?: string
      created_at?: string
      updated_at?: string
      parent?: string
      session_id?: string
      sessions?: string
    }
  }
  s3_multipart_uploads?: {
    name?: string
    fields?: {
      id?: string
      in_progress_size?: string
      upload_signature?: string
      bucket_id?: string
      key?: string
      version?: string
      owner_id?: string
      created_at?: string
      buckets?: string
      s3_multipart_uploads_parts?: string
    }
  }
  s3_multipart_uploads_parts?: {
    name?: string
    fields?: {
      id?: string
      upload_id?: string
      size?: string
      part_number?: string
      bucket_id?: string
      key?: string
      etag?: string
      owner_id?: string
      version?: string
      created_at?: string
      buckets?: string
      s3_multipart_uploads?: string
    }
  }
  saml_providers?: {
    name?: string
    fields?: {
      id?: string
      sso_provider_id?: string
      entity_id?: string
      metadata_xml?: string
      metadata_url?: string
      attribute_mapping?: string
      created_at?: string
      updated_at?: string
      name_id_format?: string
      sso_providers?: string
    }
  }
  saml_relay_states?: {
    name?: string
    fields?: {
      id?: string
      sso_provider_id?: string
      request_id?: string
      for_email?: string
      redirect_to?: string
      created_at?: string
      updated_at?: string
      flow_state_id?: string
      flow_state?: string
      sso_providers?: string
    }
  }
  auth_schema_migrations?: {
    name?: string
    fields?: {
      version?: string
    }
  }
  realtime_schema_migrations?: {
    name?: string
    fields?: {
      version?: string
      inserted_at?: string
    }
  }
  supabase_migrations_schema_migrations?: {
    name?: string
    fields?: {
      version?: string
      statements?: string
      name?: string
    }
  }
  secrets?: {
    name?: string
    fields?: {
      id?: string
      name?: string
      description?: string
      secret?: string
      key_id?: string
      nonce?: string
      created_at?: string
      updated_at?: string
      key?: string
    }
  }
  sessions?: {
    name?: string
    fields?: {
      id?: string
      user_id?: string
      created_at?: string
      updated_at?: string
      factor_id?: string
      aal?: string
      not_after?: string
      refreshed_at?: string
      user_agent?: string
      ip?: string
      tag?: string
      users?: string
      mfa_amr_claims?: string
      refresh_tokens?: string
    }
  }
  sso_domains?: {
    name?: string
    fields?: {
      id?: string
      sso_provider_id?: string
      domain?: string
      created_at?: string
      updated_at?: string
      sso_providers?: string
    }
  }
  sso_providers?: {
    name?: string
    fields?: {
      id?: string
      resource_id?: string
      created_at?: string
      updated_at?: string
      saml_providers?: string
      saml_relay_states?: string
      sso_domains?: string
    }
  }
  student_competency_progress?: {
    name?: string
    fields?: {
      student_curriculum_id?: string
      curriculum_module_competency_id?: string
      location_id?: string
      progress?: string
      created_at?: string
      updated_at?: string
      deleted_at?: string
      curriculum_competency?: string
      location?: string
      student_curriculum?: string
    }
  }
  student_completed_competency?: {
    name?: string
    fields?: {
      student_curriculum_id?: string
      curriculum_module_competency_id?: string
      certificate_id?: string
      created_at?: string
      updated_at?: string
      deleted_at?: string
      certificate?: string
      curriculum_competency?: string
      student_curriculum?: string
    }
  }
  student_curriculum?: {
    name?: string
    fields?: {
      id?: string
      person_id?: string
      curriculum_id?: string
      gear_type_id?: string
      started_at?: string
      created_at?: string
      updated_at?: string
      deleted_at?: string
      curriculum?: string
      curriculum_gear_link?: string
      gear_type?: string
      person?: string
      certificate?: string
      student_competency_progress?: string
      student_completed_competency?: string
    }
  }
  subscription?: {
    name?: string
    fields?: {
      id?: string
      subscription_id?: string
      entity?: string
      filters?: string
      claims?: string
      claims_role?: string
      created_at?: string
    }
  }
  user?: {
    name?: string
    fields?: {
      auth_user_id?: string
      email?: string
      display_name?: string
      _metadata?: string
      users?: string
      person?: string
    }
  }
  users?: {
    name?: string
    fields?: {
      instance_id?: string
      id?: string
      aud?: string
      role?: string
      email?: string
      encrypted_password?: string
      email_confirmed_at?: string
      invited_at?: string
      confirmation_token?: string
      confirmation_sent_at?: string
      recovery_token?: string
      recovery_sent_at?: string
      email_change_token_new?: string
      email_change?: string
      email_change_sent_at?: string
      last_sign_in_at?: string
      raw_app_meta_data?: string
      raw_user_meta_data?: string
      is_super_admin?: string
      created_at?: string
      updated_at?: string
      phone?: string
      phone_confirmed_at?: string
      phone_change?: string
      phone_change_token?: string
      phone_change_sent_at?: string
      confirmed_at?: string
      email_change_token_current?: string
      email_change_confirm_status?: string
      banned_until?: string
      reauthentication_token?: string
      reauthentication_sent_at?: string
      is_sso_user?: string
      deleted_at?: string
      is_anonymous?: string
      identities?: string
      mfa_factors?: string
      sessions?: string
      user?: string
    }
  }
}
export type Alias = {
  inflection?: Inflection | boolean
  override?: Override
}
interface FingerprintRelationField {
  count?: number | MinMaxOption
}
interface FingerprintJsonField {
  schema?: any
}
interface FingerprintDateField {
  options?: {
    minYear?: number
    maxYear?: number
  }
}
interface FingerprintNumberField {
  options?: {
    min?: number
    max?: number
  }
}
export interface Fingerprint {
  DrizzleMigrations?: {
    id?: FingerprintNumberField
    createdAt?: FingerprintNumberField
  }
  actors?: {
    createdAt?: FingerprintDateField
    updatedAt?: FingerprintDateField
    deletedAt?: FingerprintDateField
    Metadata?: FingerprintJsonField
    location?: FingerprintRelationField
    person?: FingerprintRelationField
    media?: FingerprintRelationField
  }
  auditLogEntries?: {
    payload?: FingerprintJsonField
    createdAt?: FingerprintDateField
  }
  broadcasts?: {
    id?: FingerprintNumberField
    channelId?: FingerprintNumberField
    insertedAt?: FingerprintDateField
    updatedAt?: FingerprintDateField
    channel?: FingerprintRelationField
  }
  buckets?: {
    createdAt?: FingerprintDateField
    updatedAt?: FingerprintDateField
    fileSizeLimit?: FingerprintNumberField
    objects?: FingerprintRelationField
    s3MultipartUploads?: FingerprintRelationField
    s3MultipartUploadsParts?: FingerprintRelationField
  }
  categories?: {
    weight?: FingerprintNumberField
    createdAt?: FingerprintDateField
    updatedAt?: FingerprintDateField
    deletedAt?: FingerprintDateField
    categoriesByParentCategoryId?: FingerprintRelationField
    categoriesByParentCategoryId?: FingerprintRelationField
    programCategories?: FingerprintRelationField
  }
  certificates?: {
    issuedAt?: FingerprintDateField
    visibleFrom?: FingerprintDateField
    createdAt?: FingerprintDateField
    updatedAt?: FingerprintDateField
    deletedAt?: FingerprintDateField
    location?: FingerprintRelationField
    studentCurriculum?: FingerprintRelationField
    studentCompletedCompetencies?: FingerprintRelationField
  }
  channels?: {
    id?: FingerprintNumberField
    insertedAt?: FingerprintDateField
    updatedAt?: FingerprintDateField
    broadcasts?: FingerprintRelationField
    presences?: FingerprintRelationField
  }
  competencies?: {
    weight?: FingerprintNumberField
    createdAt?: FingerprintDateField
    updatedAt?: FingerprintDateField
    deletedAt?: FingerprintDateField
    curriculumCompetencies?: FingerprintRelationField
  }
  countries?: {
    id?: FingerprintNumberField
    peopleByBirthCountry?: FingerprintRelationField
  }
  curriculums?: {
    startedAt?: FingerprintDateField
    createdAt?: FingerprintDateField
    updatedAt?: FingerprintDateField
    deletedAt?: FingerprintDateField
    program?: FingerprintRelationField
    curriculumGearLinks?: FingerprintRelationField
    curriculumModules?: FingerprintRelationField
    studentCurriculums?: FingerprintRelationField
  }
  curriculumCompetencies?: {
    createdAt?: FingerprintDateField
    updatedAt?: FingerprintDateField
    deletedAt?: FingerprintDateField
    competency?: FingerprintRelationField
    curriculum?: FingerprintRelationField
    studentCompetencyProgressesByCurriculumModuleCompetencyId?: FingerprintRelationField
    studentCompletedCompetenciesByCurriculumModuleCompetencyId?: FingerprintRelationField
  }
  curriculumGearLinks?: {
    createdAt?: FingerprintDateField
    updatedAt?: FingerprintDateField
    deletedAt?: FingerprintDateField
    curriculum?: FingerprintRelationField
    gearType?: FingerprintRelationField
    studentCurriculums?: FingerprintRelationField
  }
  curriculumModules?: {
    createdAt?: FingerprintDateField
    updatedAt?: FingerprintDateField
    deletedAt?: FingerprintDateField
    curriculum?: FingerprintRelationField
    module?: FingerprintRelationField
    curriculumCompetencies?: FingerprintRelationField
  }
  degrees?: {
    rang?: FingerprintNumberField
    createdAt?: FingerprintDateField
    updatedAt?: FingerprintDateField
    deletedAt?: FingerprintDateField
    programs?: FingerprintRelationField
  }
  disciplines?: {
    weight?: FingerprintNumberField
    createdAt?: FingerprintDateField
    updatedAt?: FingerprintDateField
    deletedAt?: FingerprintDateField
    programs?: FingerprintRelationField
  }
  flowStates?: {
    createdAt?: FingerprintDateField
    updatedAt?: FingerprintDateField
    authCodeIssuedAt?: FingerprintDateField
    samlRelayStates?: FingerprintRelationField
  }
  gearTypes?: {
    createdAt?: FingerprintDateField
    updatedAt?: FingerprintDateField
    deletedAt?: FingerprintDateField
    curriculumGearLinks?: FingerprintRelationField
    studentCurriculums?: FingerprintRelationField
  }
  identities?: {
    identityData?: FingerprintJsonField
    lastSignInAt?: FingerprintDateField
    createdAt?: FingerprintDateField
    updatedAt?: FingerprintDateField
    user?: FingerprintRelationField
  }
  instances?: {
    createdAt?: FingerprintDateField
    updatedAt?: FingerprintDateField
  }
  keys?: {
    created?: FingerprintDateField
    expires?: FingerprintDateField
    keyId?: FingerprintNumberField
    keysByParentKey?: FingerprintRelationField
    keysByParentKey?: FingerprintRelationField
    secrets?: FingerprintRelationField
  }
  locations?: {
    Metadata?: FingerprintJsonField
    createdAt?: FingerprintDateField
    updatedAt?: FingerprintDateField
    deletedAt?: FingerprintDateField
    certificateMedium?: FingerprintRelationField
    logoMedium?: FingerprintRelationField
    squareLogoMedium?: FingerprintRelationField
    actors?: FingerprintRelationField
    certificates?: FingerprintRelationField
    media?: FingerprintRelationField
    personLocationLinks?: FingerprintRelationField
    studentCompetencyProgresses?: FingerprintRelationField
  }
  media?: {
    size?: FingerprintNumberField
    Metadata?: FingerprintJsonField
    createdAt?: FingerprintDateField
    updatedAt?: FingerprintDateField
    deletedAt?: FingerprintDateField
    actor?: FingerprintRelationField
    location?: FingerprintRelationField
    object?: FingerprintRelationField
    locationsByCertificateMediaId?: FingerprintRelationField
    locationsByLogoMediaId?: FingerprintRelationField
    locationsBySquareLogoMediaId?: FingerprintRelationField
  }
  mfaAmrClaims?: {
    createdAt?: FingerprintDateField
    updatedAt?: FingerprintDateField
    session?: FingerprintRelationField
  }
  mfaChallenges?: {
    createdAt?: FingerprintDateField
    verifiedAt?: FingerprintDateField
    factor?: FingerprintRelationField
  }
  mfaFactors?: {
    createdAt?: FingerprintDateField
    updatedAt?: FingerprintDateField
    user?: FingerprintRelationField
    mfaChallengesByFactorId?: FingerprintRelationField
  }
  migrations?: {
    id?: FingerprintNumberField
    executedAt?: FingerprintDateField
  }
  modules?: {
    weight?: FingerprintNumberField
    createdAt?: FingerprintDateField
    updatedAt?: FingerprintDateField
    deletedAt?: FingerprintDateField
    curriculumModules?: FingerprintRelationField
  }
  objects?: {
    createdAt?: FingerprintDateField
    updatedAt?: FingerprintDateField
    lastAccessedAt?: FingerprintDateField
    metadata?: FingerprintJsonField
    bucket?: FingerprintRelationField
    media?: FingerprintRelationField
  }
  people?: {
    dateOfBirth?: FingerprintDateField
    Metadata?: FingerprintJsonField
    createdAt?: FingerprintDateField
    updatedAt?: FingerprintDateField
    deletedAt?: FingerprintDateField
    countryByBirthCountry?: FingerprintRelationField
    userByUserId?: FingerprintRelationField
    actors?: FingerprintRelationField
    personLocationLinks?: FingerprintRelationField
    studentCurriculums?: FingerprintRelationField
  }
  personLocationLinks?: {
    linkedAt?: FingerprintDateField
    revokedAt?: FingerprintDateField
    removedAt?: FingerprintDateField
    requestedAt?: FingerprintDateField
    grantedAt?: FingerprintDateField
    location?: FingerprintRelationField
    person?: FingerprintRelationField
  }
  presences?: {
    id?: FingerprintNumberField
    channelId?: FingerprintNumberField
    insertedAt?: FingerprintDateField
    updatedAt?: FingerprintDateField
    channel?: FingerprintRelationField
  }
  programs?: {
    createdAt?: FingerprintDateField
    updatedAt?: FingerprintDateField
    deletedAt?: FingerprintDateField
    degree?: FingerprintRelationField
    discipline?: FingerprintRelationField
    curriculums?: FingerprintRelationField
    programCategories?: FingerprintRelationField
  }
  programCategories?: {
    createdAt?: FingerprintDateField
    updatedAt?: FingerprintDateField
    deletedAt?: FingerprintDateField
    category?: FingerprintRelationField
    program?: FingerprintRelationField
  }
  refreshTokens?: {
    id?: FingerprintNumberField
    createdAt?: FingerprintDateField
    updatedAt?: FingerprintDateField
    session?: FingerprintRelationField
  }
  s3MultipartUploads?: {
    inProgressSize?: FingerprintNumberField
    createdAt?: FingerprintDateField
    bucket?: FingerprintRelationField
    s3MultipartUploadsPartsByUploadId?: FingerprintRelationField
  }
  s3MultipartUploadsParts?: {
    size?: FingerprintNumberField
    partNumber?: FingerprintNumberField
    createdAt?: FingerprintDateField
    bucket?: FingerprintRelationField
    upload?: FingerprintRelationField
  }
  samlProviders?: {
    attributeMapping?: FingerprintJsonField
    createdAt?: FingerprintDateField
    updatedAt?: FingerprintDateField
    ssoProvider?: FingerprintRelationField
  }
  samlRelayStates?: {
    createdAt?: FingerprintDateField
    updatedAt?: FingerprintDateField
    flowState?: FingerprintRelationField
    ssoProvider?: FingerprintRelationField
  }
  authSchemaMigrations?: {}
  realtimeSchemaMigrations?: {
    version?: FingerprintNumberField
    insertedAt?: FingerprintDateField
  }
  supabaseMigrationsSchemaMigrations?: {}
  secrets?: {
    createdAt?: FingerprintDateField
    updatedAt?: FingerprintDateField
    key?: FingerprintRelationField
  }
  sessions?: {
    createdAt?: FingerprintDateField
    updatedAt?: FingerprintDateField
    notAfter?: FingerprintDateField
    refreshedAt?: FingerprintDateField
    user?: FingerprintRelationField
    mfaAmrClaims?: FingerprintRelationField
    refreshTokens?: FingerprintRelationField
  }
  ssoDomains?: {
    createdAt?: FingerprintDateField
    updatedAt?: FingerprintDateField
    ssoProvider?: FingerprintRelationField
  }
  ssoProviders?: {
    createdAt?: FingerprintDateField
    updatedAt?: FingerprintDateField
    samlProviders?: FingerprintRelationField
    samlRelayStates?: FingerprintRelationField
    ssoDomains?: FingerprintRelationField
  }
  studentCompetencyProgresses?: {
    progress?: FingerprintNumberField
    createdAt?: FingerprintDateField
    updatedAt?: FingerprintDateField
    deletedAt?: FingerprintDateField
    curriculumModuleCompetency?: FingerprintRelationField
    location?: FingerprintRelationField
    studentCurriculum?: FingerprintRelationField
  }
  studentCompletedCompetencies?: {
    createdAt?: FingerprintDateField
    updatedAt?: FingerprintDateField
    deletedAt?: FingerprintDateField
    certificate?: FingerprintRelationField
    curriculumModuleCompetency?: FingerprintRelationField
    studentCurriculum?: FingerprintRelationField
  }
  studentCurriculums?: {
    startedAt?: FingerprintDateField
    createdAt?: FingerprintDateField
    updatedAt?: FingerprintDateField
    deletedAt?: FingerprintDateField
    curriculum?: FingerprintRelationField
    curriculum?: FingerprintRelationField
    gearType?: FingerprintRelationField
    person?: FingerprintRelationField
    certificates?: FingerprintRelationField
    studentCompetencyProgresses?: FingerprintRelationField
    studentCompletedCompetencies?: FingerprintRelationField
  }
  subscriptions?: {
    id?: FingerprintNumberField
    claims?: FingerprintJsonField
    createdAt?: FingerprintDateField
  }
  publicUsers?: {
    Metadata?: FingerprintJsonField
    authUser?: FingerprintRelationField
    peopleByUserId?: FingerprintRelationField
  }
  authUsers?: {
    emailConfirmedAt?: FingerprintDateField
    invitedAt?: FingerprintDateField
    confirmationSentAt?: FingerprintDateField
    recoverySentAt?: FingerprintDateField
    emailChangeSentAt?: FingerprintDateField
    lastSignInAt?: FingerprintDateField
    rawAppMetaData?: FingerprintJsonField
    rawUserMetaData?: FingerprintJsonField
    createdAt?: FingerprintDateField
    updatedAt?: FingerprintDateField
    phoneConfirmedAt?: FingerprintDateField
    phoneChangeSentAt?: FingerprintDateField
    confirmedAt?: FingerprintDateField
    emailChangeConfirmStatus?: FingerprintNumberField
    bannedUntil?: FingerprintDateField
    reauthenticationSentAt?: FingerprintDateField
    deletedAt?: FingerprintDateField
    identities?: FingerprintRelationField
    mfaFactors?: FingerprintRelationField
    sessions?: FingerprintRelationField
    usersByAuthUserId?: FingerprintRelationField
  }
}
