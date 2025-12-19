'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

type Diary = {
  id: number;
  journal_date: string;
  mood: number | null;
  ai_topics: string[] | null;
  sleep_quality: number | null;
  wake_level: number | null;
  daytime_level: number | null;
};

type AnalyticsViewProps = {
  diaries: Diary[];
};

export function AnalyticsView({ diaries }: AnalyticsViewProps) {
  // 感情推移データの準備
  const moodData = diaries
    .filter((d) => d.mood !== null)
    .map((d) => ({
      date: format(new Date(d.journal_date), 'M/d', { locale: ja }),
      mood: d.mood!,
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // トピック分布の準備
  const topicCounts: Record<string, number> = {};
  diaries.forEach((d) => {
    if (d.ai_topics && Array.isArray(d.ai_topics)) {
      d.ai_topics.forEach((topic) => {
        topicCounts[topic] = (topicCounts[topic] || 0) + 1;
      });
    }
  });

  const topicData = Object.entries(topicCounts).map(([name, value]) => ({
    name,
    value,
  }));

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  // 統計サマリー
  const avgMood =
    diaries.filter((d) => d.mood !== null).length > 0
      ? diaries.filter((d) => d.mood !== null).reduce((sum, d) => sum + (d.mood || 0), 0) /
        diaries.filter((d) => d.mood !== null).length
      : 0;

  const avgSleepQuality =
    diaries.filter((d) => d.sleep_quality !== null).length > 0
      ? diaries
          .filter((d) => d.sleep_quality !== null)
          .reduce((sum, d) => sum + (d.sleep_quality || 0), 0) /
        diaries.filter((d) => d.sleep_quality !== null).length
      : 0;

  return (
    <div className="space-y-6">
      <Tabs defaultValue="mood" className="w-full">
        <TabsList>
          <TabsTrigger value="mood">感情推移</TabsTrigger>
          <TabsTrigger value="topics">トピック分布</TabsTrigger>
          <TabsTrigger value="summary">統計サマリー</TabsTrigger>
        </TabsList>

        <TabsContent value="mood">
          <Card>
            <CardHeader>
              <CardTitle>過去30日間の感情推移</CardTitle>
              <CardDescription>日記の感情スコアの推移をグラフで表示</CardDescription>
            </CardHeader>
            <CardContent>
              {moodData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={moodData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={[0, 10]} />
                    <RechartsTooltip />
                    <Legend />
                    <Line type="monotone" dataKey="mood" stroke="#8884d8" name="感情スコア" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-muted-foreground py-8">データがありません</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="topics">
          <Card>
            <CardHeader>
              <CardTitle>トピック分布</CardTitle>
              <CardDescription>日記に含まれるトピックの分布</CardDescription>
            </CardHeader>
            <CardContent>
              {topicData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={topicData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {topicData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-muted-foreground py-8">データがありません</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="summary">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">平均感情スコア</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{avgMood.toFixed(1)}</p>
                <p className="text-sm text-muted-foreground">/ 10</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">平均睡眠の質</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{avgSleepQuality.toFixed(1)}</p>
                <p className="text-sm text-muted-foreground">/ 10</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">日記数</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{diaries.length}</p>
                <p className="text-sm text-muted-foreground">件</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
