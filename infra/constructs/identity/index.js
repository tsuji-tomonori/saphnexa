export const IdentityConstruct = {
  name: "IdentityConstruct",
  resources: ["CognitoUserPool", "CognitoUserPoolClient", "CognitoGroups", "GitHubOidcProvider"],
  outputs: ["userPoolId", "clientId", "issuer", "adminGroupName"]
};
