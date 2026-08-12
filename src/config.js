export const API_BASE_URL = "https://platform.zone01.gr";
export const API_SIGNIN_ENDPOINT = "/api/auth/signin";
export const API_GRAPHQL_ENDPOINT = "/api/graphql-engine/v1/graphql";

export let PREVIOUS_SECTION = "";
export let CURRENT_SECTION = "identity";
export function UpdateSectionState(newSection) {
    PREVIOUS_SECTION = CURRENT_SECTION;
    CURRENT_SECTION = newSection;
}

export const basicQuery = `
    {
        user {
            id
            login
        }
    }
`

export const maxIdentityDataQuery = `
query MaxProfileData($userId: Int!) {
  user: user_by_pk(id: $userId) {
    id
    login
    firstName
    lastName
    email
    campus
    avatarUrl
    auditRatio
    totalUp
    totalUpBonus
    totalDown
    attrs
    profile

    roles {
      slug
    }

    labels {
      labelName
      labelId
      eventId
    }

    records {
      startAt
      endAt
      message
      createdAt
      type {
        type
        label
        canAccessPlatform
        isPermanent
        canBeAuditor
      }
    }

    skills: transactions(
      order_by: [{ type: desc }, { amount: desc }]
      distinct_on: [type]
      where: {
        userId: { _eq: $userId }
        type: { _like: "skill_%" }
      }
    ) {
      type
      amount
    }
  }

  xpTotal: transaction_aggregate(
    where: {
      userId: { _eq: $userId }
      type: { _eq: "xp" }
    }
  ) {
    aggregate {
      count
      sum {
        amount
      }
      max {
        amount
        createdAt
      }
      min {
        amount
        createdAt
      }
    }
  }

  xpTransactions: transaction(
    limit: 500
    order_by: { createdAt: asc }
    where: {
      userId: { _eq: $userId }
      type: { _eq: "xp" }
    }
  ) {
    id
    type
    amount
    objectId
    userId
    eventId
    createdAt
    path
  }

  levelTransactions: transaction(
    limit: 100
    order_by: { amount: desc }
    where: {
      userId: { _eq: $userId }
      type: { _eq: "level" }
    }
  ) {
    id
    type
    amount
    objectId
    userId
    eventId
    createdAt
    path
  }

  progresses: progress(
    limit: 500
    order_by: [{ createdAt: desc }]
    where: {
      userId: { _eq: $userId }
    }
  ) {
    id
    userId
    objectId
    eventId
    grade
    isDone
    path
    version
    createdAt
    updatedAt
  }

  latestProgressByPath: progress(
    limit: 500
    order_by: [{ path: desc }, { createdAt: desc }, { grade: desc }]
    distinct_on: [path]
    where: {
      userId: { _eq: $userId }
    }
  ) {
    id
    userId
    objectId
    eventId
    grade
    isDone
    path
    version
    createdAt
    updatedAt
    event {
      id
      startAt
      endAt
    }
  }

  results: result(
    limit: 500
    order_by: { createdAt: desc }
    where: {
      userId: { _eq: $userId }
    }
  ) {
    id
    objectId
    userId
    grade
    type
    path
    createdAt
    updatedAt
  }

  passedResults: result_aggregate(
    where: {
      userId: { _eq: $userId }
      grade: { _gte: 1 }
    }
  ) {
    aggregate {
      count
    }
  }

  failedResults: result_aggregate(
    where: {
      userId: { _eq: $userId }
      grade: { _lt: 1 }
    }
  ) {
    aggregate {
      count
    }
  }
}
`