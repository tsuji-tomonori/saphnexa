export const edgeIdentityRealtimeBindings = {
  viewerBasePath: "/",
  apiVersion: "v1",
  origins: [
    origin("spa-origin", "s3", "SpaBucket", ["/", "/chat/*", "/admin/*"]),
    origin("api-origin", "http", "HttpApi", ["/api/*", "/auth/*"]),
    origin("appsync-events-origin", "http", "EventApi", ["/event/realtime*"]),
    origin("admin-artifacts-origin", "s3", "AdminArtifactsBucket", ["/admin/docs/*", "/admin/test-reports/*", "/admin/evaluation-reports/*"])
  ],
  rewrites: [
    rewrite("/", "spa-origin", "/chat/index.html"),
    rewrite("/chat/*", "spa-origin", "/chat/index.html"),
    rewrite("/admin/*", "spa-origin", "/admin/index.html"),
    rewrite("/api/*", "api-origin", "/v1/*"),
    rewrite("/auth/*", "api-origin", "/v1/auth/*"),
    rewrite("/admin/docs/latest/*", "admin-artifacts-origin", "/docs-site/latest/*"),
    rewrite("/admin/docs/versions/*", "admin-artifacts-origin", "/docs-site/releases/*"),
    rewrite("/admin/test-reports/allure/*", "admin-artifacts-origin", "/test-reports/allure/*"),
    rewrite("/admin/evaluation-reports/*", "admin-artifacts-origin", "/reports/evaluations/*")
  ],
  adminArtifactAccess: {
    signedCookieRequired: true,
    keyGroupLogicalId: "AdminArtifactsKeyGroup",
    publicKeyParameter: "AdminArtifactsPublicKeyPem",
    trustedPathPatterns: ["/admin/docs/*", "/admin/test-reports/*", "/admin/evaluation-reports/*"]
  },
  cognito: {
    oauthFlow: "code",
    callbackPath: "/auth/callback",
    logoutPath: "/auth/logout",
    scopes: ["openid", "email", "profile"],
    groups: ["general_user", "admin"]
  },
  appSyncEvents: {
    apiLogicalId: "EventApi",
    realtimeViewerPath: "/event/realtime",
    namespaces: [
      {
        name: "chat",
        channelPattern: "/{user_id}/chat/{chat_id}",
        subscribeAuthorizer: "ws-ticket",
        publishAuthMode: "AWS_IAM"
      },
      {
        name: "admin",
        channelPattern: "/admin/{admin_user_id}/{job_kind}/{job_id}",
        subscribeAuthorizer: "ws-ticket",
        publishAuthMode: "AWS_IAM"
      }
    ]
  }
};

function origin(id, kind, logicalResource, viewerPathPatterns) {
  return { id, kind, logicalResource, viewerPathPatterns };
}

function rewrite(viewerPathPattern, originId, originPathPattern) {
  return { viewerPathPattern, originId, originPathPattern };
}
