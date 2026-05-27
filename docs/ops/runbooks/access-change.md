# アクセス権変更 runbook

## 目的

ユーザー role、group、document ACL、chat participant、admin artifact 閲覧権の変更を安全に行い、権限漏えいを防ぐ。

## 前提

- 変更対象ユーザー、group、document、chat、artifact、変更理由、承認者が明確であること。
- 変更前後の権限テストを実行できること。

## 手順

1. 変更対象の現在権限を `users`、`user_group_memberships`、`document_acl_entries`、`chat_participants` で確認する。
2. 管理者操作として変更を実行し、監査ログを記録する。
3. RAG retrieval は metadata filter と ACL post-check の両方で検証する。
4. chat 共有は owner/viewer の権限差を確認する。
5. 管理成果物は管理者 200、一般 403、未認証 401/302 を確認する。

## 検証

- 権限外 document_id/chunk_id が retrieval result、Evidence、citation に含まれないこと。
- 変更対象外ユーザーの権限が変わっていないこと。
- WebSocket channel と REST detail の認可が一致すること。

## 証跡

- 変更依頼、承認、変更前後 DB query、API/RAG test 結果、監査ログ、確認日を保存する。
