import { describe, it, expect } from 'vitest';
import { analyzeSentimentMock, completeTextMock, extractTopicsMock } from './mock';

describe('analyzeSentimentMock', () => {
  it('ポジティブなテキストに対してポジティブな感情を返す', async () => {
    const text = '今日は良い一日でした。楽しい時間を過ごせました。';
    const result = await analyzeSentimentMock(text);
    
    expect(result.sentiment).toBe('positive');
    expect(result.score).toBeGreaterThanOrEqual(7);
    expect(result.score).toBeLessThanOrEqual(10);
    expect(result.confidence).toBeGreaterThanOrEqual(0.7);
    expect(result.topics).toBeInstanceOf(Array);
    expect(result.summary).toBeTruthy();
  });

  it('ネガティブなテキストに対してネガティブな感情を返す', async () => {
    const text = '今日は悪い一日でした。悲しい出来事がありました。';
    const result = await analyzeSentimentMock(text);
    
    expect(result.sentiment).toBe('negative');
    expect(result.score).toBeGreaterThanOrEqual(1);
    expect(result.score).toBeLessThanOrEqual(4);
  });

  it('ニュートラルなテキストに対してニュートラルな感情を返す', async () => {
    const text = '今日は普通の一日でした。';
    const result = await analyzeSentimentMock(text);
    
    expect(result.sentiment).toBe('neutral');
    expect(result.score).toBeGreaterThanOrEqual(4);
    expect(result.score).toBeLessThanOrEqual(6);
  });

  it('トピックを抽出する', async () => {
    const text = '今日は仕事で忙しかった。家族と食事をした。';
    const result = await analyzeSentimentMock(text);
    
    expect(result.topics).toContain('仕事');
    expect(result.topics).toContain('家族');
  });
});

describe('completeTextMock', () => {
  it('テキストを補完する', async () => {
    const text = '今日は';
    const result = await completeTextMock(text);
    
    expect(result).toContain('今日は');
    expect(result.length).toBeGreaterThan(text.length);
  });
});

describe('extractTopicsMock', () => {
  it('テキストからトピックを抽出する', async () => {
    const text = '今日は仕事で忙しかった。健康に気をつけている。';
    const topics = await extractTopicsMock(text);
    
    expect(topics).toContain('仕事');
    expect(topics).toContain('健康');
    expect(topics.length).toBeGreaterThan(0);
  });

  it('トピックが見つからない場合は「日常」を返す', async () => {
    const text = '特に何もない一日でした。';
    const topics = await extractTopicsMock(text);
    
    expect(topics).toContain('日常');
  });
});

