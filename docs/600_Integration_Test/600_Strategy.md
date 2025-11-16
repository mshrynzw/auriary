# 結合テスト戦略

## 1. 目的

結合テストは、**API Route Handler と Supabase の連携**を検証するテストです。auriary プロジェクトでは、Server Actions、Route Handlers、データベース操作、RLS ポリシーの動作を統合的に検証します。

### 1.1 結合テストの役割

- **API Route Handler の検証**: リクエスト/レスポンスの処理
- **Supabase 連携の検証**: データベース操作の正常性
- **RLS ポリシーの検証**: ユーザースコープの分離
- **認証フローの検証**: 認証状態に応じた動作
- **エラーハンドリングの検証**: 異常系の処理

---

## 2. API Route Handler から Supabase

### 2.1 テスト対象

結合テストでは、以下の API Route Handler をテストします：

- **日記 CRUD**: `GET /api/diaries`, `POST /api/diaries`, `PATCH /api/diaries/[id]`, `DELETE /api/diaries/[id]`
- **AI 機能**: `POST /api/ai/complete`, `POST /api/ai/analyze`, `POST /api/ai/summarize`
- **認証関連**: `POST /api/auth/login`, `POST /api/auth/logout`, `POST /api/auth/register`
- **通知関連（将来実装）**: `GET /api/notifications`, `PATCH /api/notifications/[id]`

### 2.2 テストの流れ

```typescript
// src/__tests__/integration/api/diaries.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createSupabaseTestClient } from '@/__tests__/helpers/supabase';
import request from 'supertest';
import { createServer } from '@/app/api/diaries/route';

describe('POST /api/diaries', () => {
  let supabase: ReturnType<typeof createSupabaseTestClient>;
  let testUserId: string;

  beforeEach(async () => {
    // テスト用の Supabase クライアントを作成
    supabase = createSupabaseTestClient();
    
    // テストユーザーを作成
    const { data: user } = await supabase.auth.signUp({
      email: 'test@example.com',
      password: 'password123',
    });
    testUserId = user.user!.id;
  });

  afterEach(async () => {
    // テストデータをクリーンアップ
    await supabase.from('t_diaries').delete().eq('user_id', testUserId);
    await supabase.auth.admin.deleteUser(testUserId);
  });

  it('日記を作成できる', async () => {
    const response = await request(createServer())
      .post('/api/diaries')
      .set('Cookie', await getAuthCookie(testUserId))
      .send({
        diary_date: '2025-01-10',
        note: 'Test note',
      });

    expect(response.status).toBe(201);
    expect(response.body.diary).toBeDefined();
    expect(response.body.diary.note).toBe('Test note');
  });
});
```

---

## 3. Supabase Local Test DB

### 3.1 ローカルテスト環境の構築

結合テストでは、**Supabase Local Test DB** を使用します。

```bash
# Supabase Local を起動
npx supabase start

# テスト用のデータベースを初期化
npx supabase db reset --db-url postgresql://postgres:postgres@localhost:54322/postgres
```

### 3.2 テスト用 Supabase クライアント

```typescript
// src/__tests__/helpers/supabase.ts
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_TEST_URL || 'http://localhost:54321';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_TEST_SERVICE_ROLE_KEY || '';

export function createSupabaseTestClient() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export function createSupabaseAuthClient() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
```

---

## 4. RLS テスト

### 4.1 RLS ポリシーの検証

結合テストでは、**RLS ポリシーが正しく動作しているか**を検証します。

```typescript
// src/__tests__/integration/rls/diaries.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { createSupabaseTestClient } from '@/__tests__/helpers/supabase';

describe('RLS: t_diaries', () => {
  let supabaseUser1: ReturnType<typeof createSupabaseTestClient>;
  let supabaseUser2: ReturnType<typeof createSupabaseTestClient>;
  let user1Id: string;
  let user2Id: string;

  beforeEach(async () => {
    // 2つのテストユーザーを作成
    const { data: user1 } = await supabase.auth.signUp({
      email: 'user1@example.com',
      password: 'password123',
    });
    user1Id = user1.user!.id;

    const { data: user2 } = await supabase.auth.signUp({
      email: 'user2@example.com',
      password: 'password123',
    });
    user2Id = user2.user!.id;

    // ユーザーごとの Supabase クライアントを作成
    supabaseUser1 = createSupabaseTestClient(user1Id);
    supabaseUser2 = createSupabaseTestClient(user2Id);
  });

  it('ユーザー1は自分の日記のみ取得できる', async () => {
    // ユーザー1の日記を作成
    const { data: diary1 } = await supabaseUser1
      .from('t_diaries')
      .insert({
        user_id: user1Id,
        diary_date: '2025-01-10',
        note: 'User 1 diary',
      })
      .select()
      .single();

    // ユーザー2の日記を作成
    await supabaseUser2
      .from('t_diaries')
      .insert({
        user_id: user2Id,
        diary_date: '2025-01-10',
        note: 'User 2 diary',
      });

    // ユーザー1が取得できる日記を確認
    const { data: diaries } = await supabaseUser1
      .from('t_diaries')
      .select();

    expect(diaries).toHaveLength(1);
    expect(diaries![0].id).toBe(diary1!.id);
    expect(diaries![0].note).toBe('User 1 diary');
  });

  it('ユーザー1はユーザー2の日記を取得できない', async () => {
    // ユーザー2の日記を作成
    await supabaseUser2
      .from('t_diaries')
      .insert({
        user_id: user2Id,
        diary_date: '2025-01-10',
        note: 'User 2 diary',
      });

    // ユーザー1が取得できる日記を確認
    const { data: diaries } = await supabaseUser1
      .from('t_diaries')
      .select();

    expect(diaries).toHaveLength(0);
  });

  it('ユーザー1はユーザー2の日記を更新できない', async () => {
    // ユーザー2の日記を作成
    const { data: diary2 } = await supabaseUser2
      .from('t_diaries')
      .insert({
        user_id: user2Id,
        diary_date: '2025-01-10',
        note: 'User 2 diary',
      })
      .select()
      .single();

    // ユーザー1がユーザー2の日記を更新しようとする
    const { error } = await supabaseUser1
      .from('t_diaries')
      .update({ note: 'Hacked' })
      .eq('id', diary2!.id);

    expect(error).toBeDefined();
    expect(error!.message).toContain('permission denied');
  });
});
```

---

## 5. Service Role key

### 5.1 Service Role key の使用

結合テストでは、**Service Role key** を使用してテストデータのセットアップとクリーンアップを行います。

```typescript
// src/__tests__/helpers/supabase.ts
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_TEST_URL || 'http://localhost:54321';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_TEST_SERVICE_ROLE_KEY || '';

// Service Role key を使用したクライアント（RLS をバイパス）
export function createSupabaseServiceRoleClient() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// テストユーザー用のクライアント（RLS が有効）
export function createSupabaseTestClient(userId?: string) {
  const client = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  
  if (userId) {
    // ユーザーコンテキストを設定
    client.auth.setSession({
      access_token: 'test-token',
      refresh_token: 'test-refresh-token',
    });
  }
  
  return client;
}
```

### 5.2 注意点

- **Service Role key はテスト環境でのみ使用**: 本番環境では絶対に使用しない
- **RLS テストでは Service Role key を使用しない**: ユーザーコンテキストを使用
- **クリーンアップ時は Service Role key を使用**: テストデータの削除

---

## 6. Supertest + Vitest

### 6.1 Supertest の設定

結合テストでは、**Supertest** を使用して API Route Handler をテストします。

```typescript
// src/__tests__/integration/api/diaries.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/diaries/route';

// Next.js App Router の Route Handler をテストするためのヘルパー
async function createTestRequest(body: any, headers: Record<string, string> = {}) {
  const request = new NextRequest('http://localhost:3000/api/diaries', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(body),
  });
  return request;
}

describe('POST /api/diaries', () => {
  it('日記を作成できる', async () => {
    const request = await createTestRequest(
      {
        diary_date: '2025-01-10',
        note: 'Test note',
      },
      {
        Cookie: await getAuthCookie(testUserId),
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.diary).toBeDefined();
    expect(data.diary.note).toBe('Test note');
  });
});
```

### 6.2 認証のモック

```typescript
// src/__tests__/helpers/auth.ts
import { createSupabaseTestClient } from './supabase';

export async function getAuthCookie(userId: string): Promise<string> {
  const supabase = createSupabaseServiceRoleClient();
  const { data: session } = await supabase.auth.admin.createSession(userId);
  
  // Cookie 形式の文字列を返す
  return `sb-access-token=${session!.access_token}; sb-refresh-token=${session!.refresh_token}`;
}
```

---

## 7. 正常系 / 異常系

### 7.1 正常系のテスト

```typescript
describe('POST /api/diaries', () => {
  it('日記を作成できる', async () => {
    const request = await createTestRequest({
      diary_date: '2025-01-10',
      note: 'Test note',
      mood: 5,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.diary).toBeDefined();
    expect(data.diary.diary_date).toBe('2025-01-10');
    expect(data.diary.note).toBe('Test note');
    expect(data.diary.mood).toBe(5);
  });

  it('日記一覧を取得できる', async () => {
    // テストデータを作成
    await createTestDiary(testUserId, { diary_date: '2025-01-10' });
    await createTestDiary(testUserId, { diary_date: '2025-01-11' });

    const request = await createTestRequest(
      {},
      { Cookie: await getAuthCookie(testUserId) }
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.diaries).toHaveLength(2);
  });
});
```

### 7.2 異常系のテスト

```typescript
describe('POST /api/diaries', () => {
  it('無効な日付形式の場合にエラーを返す', async () => {
    const request = await createTestRequest({
      diary_date: 'invalid-date',
      note: 'Test note',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBeDefined();
    expect(data.error.message).toContain('diary_date');
  });

  it('認証されていない場合にエラーを返す', async () => {
    const request = await createTestRequest({
      diary_date: '2025-01-10',
      note: 'Test note',
    });
    // Cookie を設定しない

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBeDefined();
  });

  it('note が 10000 文字を超える場合にエラーを返す', async () => {
    const request = await createTestRequest({
      diary_date: '2025-01-10',
      note: 'a'.repeat(10001),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBeDefined();
  });
});
```

---

## 8. API Schema Contract Test

### 8.1 Zod スキーマとの整合性

結合テストでは、**API のリクエスト/レスポンスが Zod スキーマと一致しているか**を検証します。

```typescript
// src/__tests__/integration/api/diaries.test.ts
import { createDiaryFormSchema, diaryRowSchema } from '@/schemas';

describe('POST /api/diaries', () => {
  it('レスポンスが diaryRowSchema に準拠している', async () => {
    const request = await createTestRequest({
      journal_date: '2025-01-10',
      note: 'Test note',
    });

    const response = await POST(request);
    const data = await response.json();

    // Zod スキーマで検証
    const validated = diaryRowSchema.parse(data);
    expect(validated).toBeDefined();
    expect(validated.journal_date).toBeDefined();
  });
});
```

---

## 9. auth モッキング

### 9.1 認証状態のモック

結合テストでは、**認証状態をモック**してテストします。

```typescript
// src/__tests__/helpers/auth.ts
import { createSupabaseServiceRoleClient } from './supabase';

export async function createTestUser(email: string, password: string) {
  const supabase = createSupabaseServiceRoleClient();
  const { data: user, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  
  if (error) throw error;
  return user.user!;
}

export async function getAuthCookie(userId: string): Promise<string> {
  const supabase = createSupabaseServiceRoleClient();
  const { data: session } = await supabase.auth.admin.createSession(userId);
  
  return `sb-access-token=${session!.access_token}; sb-refresh-token=${session!.refresh_token}`;
}
```

### 9.2 認証ミドルウェアのモック

```typescript
// src/__tests__/helpers/middleware.ts
import { NextRequest } from 'next/server';

export function createAuthenticatedRequest(
  url: string,
  userId: string,
  body?: any
): NextRequest {
  const request = new NextRequest(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: `sb-access-token=test-token-${userId}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  
  // 認証情報をリクエストに付与
  (request as any).user = { id: userId };
  
  return request;
}
```

---

## 10. トランザクションロールバック

### 10.1 テストデータのクリーンアップ

結合テストでは、**各テスト後にテストデータをクリーンアップ**します。

```typescript
describe('POST /api/diaries', () => {
  let testUserId: string;

  beforeEach(async () => {
    // テストユーザーを作成
    testUserId = await createTestUser('test@example.com', 'password123');
  });

  afterEach(async () => {
    // テストデータをクリーンアップ
    const supabase = createSupabaseServiceRoleClient();
    await supabase.from('t_diaries').delete().eq('user_id', testUserId);
    await supabase.auth.admin.deleteUser(testUserId);
  });

  it('日記を作成できる', async () => {
    // テスト実行
  });
});
```

### 10.2 トランザクションの使用（将来実装）

将来的には、**トランザクションを使用してテストデータをロールバック**することを検討します。

```typescript
// 将来実装予定
describe('POST /api/diaries', () => {
  it('日記を作成できる', async () => {
    await supabase.rpc('begin_test_transaction');
    
    try {
      // テスト実行
      const response = await POST(request);
      expect(response.status).toBe(201);
    } finally {
      // トランザクションをロールバック
      await supabase.rpc('rollback_test_transaction');
    }
  });
});
```

---

## 11. フォルダ構造

```
src/
└── __tests__/
    └── integration/
        ├── api/
        │   ├── diaries.test.ts
        │   ├── ai.test.ts
        │   └── auth.test.ts
        ├── rls/
        │   ├── diaries.test.ts
        │   └── users.test.ts
        └── helpers/
            ├── supabase.ts
            ├── auth.ts
            └── fixtures.ts
```

---

## 12. 実装例

### 12.1 日記 CRUD の結合テスト

```typescript
// src/__tests__/integration/api/diaries.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createSupabaseServiceRoleClient } from '@/__tests__/helpers/supabase';
import { createTestUser, getAuthCookie } from '@/__tests__/helpers/auth';
import { POST, GET, PATCH, DELETE } from '@/app/api/diaries/route';
import { createTestRequest } from '@/__tests__/helpers/request';

describe('API: /api/diaries', () => {
  let testUserId: string;
  let testDiaryId: number;

  beforeEach(async () => {
    testUserId = await createTestUser('test@example.com', 'password123');
  });

  afterEach(async () => {
    const supabase = createSupabaseServiceRoleClient();
    if (testDiaryId) {
      await supabase.from('t_diaries').delete().eq('id', testDiaryId);
    }
    await supabase.auth.admin.deleteUser(testUserId);
  });

  describe('POST /api/diaries', () => {
    it('日記を作成できる', async () => {
      const request = await createTestRequest(
        {
          diary_date: '2025-01-10',
          note: 'Test note',
          mood: 5,
        },
        { Cookie: await getAuthCookie(testUserId) }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.diary).toBeDefined();
      expect(data.diary.note).toBe('Test note');
      testDiaryId = data.diary.id;
    });

    it('無効な日付形式の場合にエラーを返す', async () => {
      const request = await createTestRequest(
        {
          diary_date: 'invalid-date',
          note: 'Test note',
        },
        { Cookie: await getAuthCookie(testUserId) }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
    });
  });

  describe('GET /api/diaries', () => {
    beforeEach(async () => {
      // テストデータを作成
      const supabase = createSupabaseServiceRoleClient();
      const { data: diary } = await supabase
        .from('t_diaries')
        .insert({
          user_id: testUserId,
          diary_date: '2025-01-10',
          note: 'Test note',
        })
        .select()
        .single();
      testDiaryId = diary!.id;
    });

    it('日記一覧を取得できる', async () => {
      const request = await createTestRequest(
        {},
        { Cookie: await getAuthCookie(testUserId) }
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.diaries).toHaveLength(1);
      expect(data.diaries[0].id).toBe(testDiaryId);
    });
  });

  describe('PATCH /api/diaries/[id]', () => {
    beforeEach(async () => {
      const supabase = createSupabaseServiceRoleClient();
      const { data: diary } = await supabase
        .from('t_diaries')
        .insert({
          user_id: testUserId,
          diary_date: '2025-01-10',
          note: 'Test note',
        })
        .select()
        .single();
      testDiaryId = diary!.id;
    });

    it('日記を更新できる', async () => {
      const request = await createTestRequest(
        {
          note: 'Updated note',
        },
        { Cookie: await getAuthCookie(testUserId) }
      );

      const response = await PATCH(request, { params: { id: testDiaryId.toString() } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.diary.note).toBe('Updated note');
    });
  });

  describe('DELETE /api/diaries/[id]', () => {
    beforeEach(async () => {
      const supabase = createSupabaseServiceRoleClient();
      const { data: diary } = await supabase
        .from('t_diaries')
        .insert({
          user_id: testUserId,
          diary_date: '2025-01-10',
          note: 'Test note',
        })
        .select()
        .single();
      testDiaryId = diary!.id;
    });

    it('日記を削除できる', async () => {
      const request = await createTestRequest(
        {},
        { Cookie: await getAuthCookie(testUserId) }
      );

      const response = await DELETE(request, { params: { id: testDiaryId.toString() } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });
});
```

---

## 13. Cursor 自動生成情報

### 13.1 Cursor への指示

Cursor が結合テストを生成する際は、以下の情報を参照してください：

1. **テスト戦略ドキュメント**
   - `docs/600_Integration_Test/600_Strategy.md`（本ドキュメント）
   - `docs/400_Test_Operation_Guideline/` 配下のドキュメント

2. **既存テスト例**
   - `src/__tests__/integration/**/*.test.ts` - 既存の結合テスト

3. **実装コード**
   - `src/app/api/**/route.ts` - API Route Handler
   - `src/schemas/**` - Zod スキーマ
   - `src/lib/supabase.ts` - Supabase クライアント

### 13.2 自動生成時の注意点

- **RLS テスト**: 必ず RLS ポリシーのテストを含める
- **認証モック**: 認証状態を適切にモック化
- **クリーンアップ**: テストデータのクリーンアップを実装
- **正常系・異常系**: 両方のテストケースを含める

---

**関連ドキュメント:**
- [テスト運用ガイドライン](../400_Test_Operation_Guideline/400_Guideline.md)
- [単体テスト戦略](../500_Unit_Test/500_Strategy.md)
- [E2Eテスト戦略](../700_E2E_Test/700Strategy.md)
- [API設計](../202_DetailedDesign/206_DetailedDesign_API.md)
- [データベース設計](../202_DetailedDesign/205_DetailedDesign_Database.md)

