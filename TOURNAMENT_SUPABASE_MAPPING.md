# Tournament Supabase 字段映射

本文档列出了 Tournament 前端类型与 Supabase `tournament` 表的字段映射关系。

## Supabase `tournament` 表字段

根据 `supabase.ts` schema，`tournament` 表包含以下字段：

### 直接映射字段

| Supabase 字段 | 前端 Tournament 字段 | 类型 | 说明 |
|--------------|---------------------|------|------|
| `id` | `id` | `number` → `string` | 赛事 ID（需要转换为字符串） |
| `club_id` | `clubId` | `number` → `string` | 所属俱乐部 ID（需要转换为字符串） |
| `name` | `name` | `string` | 赛事名称 |
| `buyin_amount + registration_fee` | `buyIn` | `number` | 报名费（前端 buyIn = buyin_amount + registration_fee） |
| `registration_fee` | `fee` | `number` | 手续费（保留字段，但前端总费用显示为 buyIn） |
| `scheduled_start_time` | `startTime` | `string` (ISO) | 预定开始时间 |
| `max_players` | `maxCap` | `number` | 最大参赛人数 |
| `clock_url` | `clockUrl` | `string \| null` → `string?` | 赛事时钟链接（可选） |
| `status` | - | `tournament_status` enum | 赛事状态：`completed`（已结束，不显示）、`in_progress`（报名中）、`cancelled`（取消，不显示） |
| `duration_minutes` | - | `number \| null` | 比赛时长（分钟），用于显示在赛事详情中 |

### 需要从关联表获取的字段

| 前端 Tournament 字段 | Supabase 来源 | 说明 |
|---------------------|--------------|------|
| `startingChips` | `blind_structure.starting_chips` | 起始筹码（通过 `blind_structure_id` 关联） |
| `structure` | `blind_structure.blind_levels` | 盲注结构（JSON，需要解析为 `BlindLevel[]`），用于显示在赛事详情下方的盲注结构表 |
| `maxRebuy` | `blind_structure.max_buyin_entries` | 最大重购次数（通过 `blind_structure_id` 关联） |
| `lateRegLevel` | `blind_structure.last_buyin_level` | 延迟报名截止级别（通过 `blind_structure_id` 关联） |
| `isLateRegEnded` | 计算字段 | 根据 `registration_end_time` 和当前时间计算 |
| `reservedCount` | `tournament_player` 表统计 | 已预约人数：`status = 'pending_review'`（已预约）+ `status = 'confirmed'`（已报名） |

### 前端特有字段（Supabase 中没有对应）

| 前端 Tournament 字段 | 说明 | 建议处理方式 |
|---------------------|------|------------|
| `description` | 赛事描述 | 先维持 mock data，等待后端补充 |
| `type` | 赛事类型（`TournamentType`） | 先维持 mock data，等待后端补充 |
| `promotionNote` | 推广备注 | 前端代码中有使用（在 TournamentDetailModal 中显示"赛事公告与规则"），但 Supabase 中没有对应字段，先维持 mock data |

### Supabase 中有但前端暂未使用的字段

| Supabase 字段 | 类型 | 说明 |
|--------------|------|------|
| `blind_structure_id` | `number` | 盲注结构 ID（用于关联查询 `blind_structure` 表，获取盲注结构显示在赛事详情下方） |
| `payout_model_id` | `number` | 奖金模型 ID（用于关联查询，前端暂未使用） |
| `min_players` | `number` | 最小参赛人数（前端暂未使用） |
| `duration_minutes` | `number \| null` | 比赛时长（分钟），用于显示在赛事详情中的"比赛时长" |
| `registration_start_time` | `string` | 报名开始时间（前端暂未使用） |
| `registration_end_time` | `string \| null` | 报名结束时间（用于计算 `isLateRegEnded`） |
| `started_at` | `string \| null` | 实际开始时间（前端暂未使用） |
| `ended_at` | `string \| null` | 实际结束时间（前端暂未使用） |
| `is_paused` | `boolean` | 是否暂停（前端暂未使用） |
| `paused_at` | `string \| null` | 暂停时间（前端暂未使用） |
| `prize_pool` | `number \| null` | 奖池总额（前端暂未使用） |
| `prize_structure` | `Json \| null` | 奖金结构（JSON，前端暂未使用） |
| `created_at` | `string` | 创建时间（前端暂未使用） |
| `updated_at` | `string` | 更新时间（前端暂未使用） |
| `location` | `string \| null` | 赛事地点（前端暂未使用，不需要） |

## 关联表说明

### `blind_structure` 表
- `id`: 盲注结构 ID
- `name`: 结构名称
- `description`: 描述
- `starting_chips`: 起始筹码
- `blind_levels`: 盲注级别（JSON，需要解析）
- `allow_rebuy`: 是否允许重购
- `max_buyin_entries`: 最大重购次数
- `last_buyin_level`: 最后可重购级别

### `payout_model` 表
- `id`: 奖金模型 ID
- `name`: 模型名称
- `description`: 描述
- `payout_rules`: 奖金规则（JSON）
- `ranges`: 范围
- `is_default`: 是否为默认模型

### `tournament_player` 表
用于统计已预约/已确认的参赛人数：
- `tournament_id`: 赛事 ID
- `member_id`: 会员 ID
- `status`: 状态（`pending_review`, `confirmed`, `active`, `eliminated`, `cancelled`）
- `requested_at`: 申请时间
- `confirmed_at`: 确认时间

## 映射建议

### 查询时需要 JOIN 的表
1. `blind_structure` - 获取起始筹码、盲注结构、重购信息
2. `tournament_player` - 统计已预约人数（可选，也可以单独查询）

### 数据转换逻辑

```typescript
// 伪代码示例
function tournamentRowToTournament(
  row: TournamentRow, 
  blindStructure: BlindStructureRow, 
  reservedCount: number,
  confirmedCount: number
): Tournament {
  // 计算总报名费：buyin_amount + registration_fee
  const totalBuyIn = row.buyin_amount + row.registration_fee;
  
  // 状态过滤：completed 和 cancelled 不显示
  if (row.status === 'completed' || row.status === 'cancelled') {
    return null; // 不返回这些状态的赛事
  }
  
  return {
    id: row.id.toString(),
    clubId: row.club_id.toString(),
    name: row.name,
    buyIn: totalBuyIn, // 前端 buyIn = buyin_amount + registration_fee
    fee: row.registration_fee, // 保留 fee 字段，但前端总费用显示为 buyIn
    startingChips: blindStructure.starting_chips,
    startTime: row.scheduled_start_time,
    maxCap: row.max_players,
    reservedCount: reservedCount + confirmedCount, // pending_review (已预约) + confirmed (已报名)
    isLateRegEnded: row.registration_end_time ? new Date(row.registration_end_time) < new Date() : false,
    lateRegLevel: blindStructure.last_buyin_level || 0,
    maxRebuy: blindStructure.max_buyin_entries || undefined,
    structure: parseBlindLevels(blindStructure.blind_levels), // 需要解析 JSON，用于显示盲注结构表
    clockUrl: row.clock_url || undefined,
    // 以下字段先维持 mock data，等待后端补充
    description: undefined, // Mock data
    type: '錦標賽', // Mock data
    promotionNote: undefined, // Mock data（前端有使用，显示"赛事公告与规则"）
  };
}

// duration_minutes 用于显示在赛事详情中的"比赛时长"
// 如果 duration_minutes 存在，直接使用；否则从 structure 计算总时长
const displayDuration = row.duration_minutes || calculateDurationFromStructure(blindStructure.blind_levels);
```

## 注意事项

1. **ID 类型转换**: Supabase 使用 `number`，前端使用 `string`，需要进行转换
2. **buyIn 计算**: 前端 `buyIn` = `buyin_amount + registration_fee`（总报名费）
3. **状态过滤**: `status = 'completed'`（已结束）和 `status = 'cancelled'`（取消）的赛事不显示
4. **JSON 解析**: `blind_levels` 是 JSON 类型，需要解析为 `BlindLevel[]`，用于显示在赛事详情下方的盲注结构表
5. **时间字段**: `registration_end_time` 用于计算 `isLateRegEnded`
6. **统计字段**: `reservedCount` = `tournament_player` 表中 `status = 'pending_review'`（已预约）的数量 + `status = 'confirmed'`（已报名）的数量
7. **比赛时长**: `duration_minutes` 用于显示在赛事详情中的"比赛时长"，如果不存在则从 `blind_levels` 计算总时长
8. **缺失字段**: `description`, `type`, `promotionNote` 先维持 mock data，等待后端补充
9. **关联查询**: 需要通过 `blind_structure_id` JOIN `blind_structure` 表获取盲注结构信息

