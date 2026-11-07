/**
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest';
import {
  bankPurposeNameMaxLength,
  bankPurposeTextColor,
  parseBankPurposeInput,
} from './m_bank_purposes';

describe('用途の名前と文字色', () => {
  it('名前の前後の空白を除き、空は受け付けない', () => {
    expect(parseBankPurposeInput({ name: ' 食費 ', textColor: '#000000' })).toEqual({
      ok: true,
      name: '食費',
      textColor: '#000000',
    });
    expect(parseBankPurposeInput({ name: '   ', textColor: '#000000' })).toMatchObject({
      ok: false,
      message: '用途名を入力してください',
    });
  });

  it('名前は30文字まで', () => {
    const name = 'あ'.repeat(bankPurposeNameMaxLength);
    expect(parseBankPurposeInput({ name, textColor: '#000000' }).ok).toBe(true);
    expect(parseBankPurposeInput({ name: `${name}あ`, textColor: '#000000' })).toMatchObject({
      ok: false,
    });
  });

  it('文字色は #RRGGBB に揃え、空は灰色にする', () => {
    expect(parseBankPurposeInput({ name: '食費', textColor: ' #DC2626 ' })).toEqual({
      ok: true,
      name: '食費',
      textColor: '#dc2626',
    });
    expect(parseBankPurposeInput({ name: '食費', textColor: '' })).toMatchObject({
      ok: true,
      textColor: '#808080',
    });
    expect(parseBankPurposeInput({ name: '食費', textColor: '#fff' })).toMatchObject({
      ok: false,
      message: '文字色は #RRGGBB で指定してください',
    });
    expect(parseBankPurposeInput({ name: '食費', textColor: 'red' }).ok).toBe(false);
  });

  it('表示に使う色は16進6桁だけ', () => {
    expect(bankPurposeTextColor('#DC2626')).toBe('#dc2626');
    expect(bankPurposeTextColor('red')).toBe('#808080');
  });
});
