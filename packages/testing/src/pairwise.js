export const pairwiseCases = [
  pair("TC-001", "一般ユーザー", "認証済み", "閲覧可", "active", "通常回答", "chat", "通常質問", "根拠付き回答が返る。"),
  pair("TC-002", "一般ユーザー", "認証済み", "閲覧不可", "active", "回答不能", "chat", "通常質問", "権限外情報を出さず回答不能になる。"),
  pair("TC-003", "一般ユーザー", "未認証", "閲覧可", "active", "エラー", "chat", "通常質問", "ログインへ誘導される。"),
  pair("TC-004", "一般ユーザー", "期限切れsession", "閲覧可", "active", "エラー", "chat", "通常質問", "refreshまたは再ログインへ誘導される。"),
  pair("TC-005", "一般ユーザー", "認証済み", "混在", "active", "通常回答", "chat", "図面参照質問", "閲覧可の根拠だけで回答する。"),
  pair("TC-006", "一般ユーザー", "認証済み", "閲覧可", "archived", "回答不能", "chat", "通常質問", "archived文書を根拠にしない。"),
  pair("TC-007", "一般ユーザー", "認証済み", "閲覧可", "failed", "回答不能", "chat", "通常質問", "failed文書版を回答対象にしない。"),
  pair("TC-008", "管理者", "認証済み", "閲覧可", "active", "通常回答", "admin ingestion", "PDF登録", "取り込み進捗通知を受け取る。"),
  pair("TC-009", "管理者", "認証済み", "閲覧可", "active", "エラー", "admin ingestion", "PDF登録", "不正PDFで失敗理由を確認できる。"),
  pair("TC-010", "管理者", "認証済み", "閲覧可", "active", "通常回答", "admin user import", "CSV/XLSX取込", "成功件数と失敗行を確認できる。"),
  pair("TC-011", "管理者", "認証済み", "閲覧可", "active", "エラー", "admin user import", "CSV/XLSX取込", "形式不正で行別エラーを確認できる。"),
  pair("TC-012", "管理者", "認証済み", "閲覧可", "active", "通常回答", "admin evaluation", "評価実行", "評価runが完了し指標が保存される。"),
  pair("TC-013", "管理者", "未認証", "閲覧可", "active", "エラー", "admin evaluation", "評価実行", "管理画面へアクセスできない。"),
  pair("TC-014", "一般ユーザー", "認証済み", "閲覧可", "active", "エラー", "admin ingestion", "PDF登録", "管理者APIを実行できない。"),
  pair("TC-015", "管理者", "期限切れsession", "閲覧可", "active", "エラー", "admin user import", "CSV/XLSX取込", "再ログイン後に再実行できる。")
];

function pair(id, actor, auth_state, document_acl, document_status, response_mode, channel_type, input_type, expected) {
  return { id, actor, auth_state, document_acl, document_status, response_mode, channel_type, input_type, expected };
}
