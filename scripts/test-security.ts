/**
 * 安全防護測試腳本
 * 執行：npx tsx scripts/test-security.ts
 */

import { detectSensitiveKeywords } from '../lib/security/sensitive-keywords';
import { filterAIOutput } from '../lib/security/output-filter';
import { getSafetyFallbackResponse } from '../lib/security/secure-prompt';

const TEST_CASES = [
  // 高風險測試
  {
    name: '客戶要求退款',
    input: '你好，我要退款，請馬上處理',
    expectedRisk: 'high' as const,
  },
  {
    name: '客戶要求折扣',
    input: '可以給我打折嗎？',
    expectedRisk: 'high' as const,
  },
  {
    name: '客戶詢問醫療建議',
    input: '我頭痛應該吃什麼藥？',
    expectedRisk: 'high' as const,
  },

  // 中風險測試
  {
    name: '客戶要轉人工',
    input: '我要找真人客服',
    expectedRisk: 'medium' as const,
  },
  {
    name: '客戶抱怨',
    input: '你們的服務態度很差',
    expectedRisk: 'medium' as const,
  },

  // 低風險測試
  {
    name: '一般詢問',
    input: '請問營業時間是幾點？',
    expectedRisk: 'low' as const,
  },
];

const OUTPUT_TEST_CASES = [
  {
    name: '承諾退款金額',
    output: '好的，我將為您退還 1000 元',
    shouldBlock: true,
  },
  {
    name: '洩漏內部資訊',
    output: '我們的 openai api key 是...',
    shouldBlock: true,
  },
  {
    name: '提供醫療建議',
    output: '建議你服用阿斯匹靈',
    shouldBlock: true,
  },
  {
    name: '安全回覆',
    output: '我們的營業時間是週一到週五 9:00-18:00',
    shouldBlock: false,
  },
];

async function runTests() {
  console.log('🧪 開始測試安全防護機制\n');

  // 測試輸入檢測
  console.log('=== 測試 1：輸入風險檢測 ===\n');
  for (const testCase of TEST_CASES) {
    const result = detectSensitiveKeywords(testCase.input);
    const passed = result.riskLevel === testCase.expectedRisk;

    console.log(`${passed ? '✅' : '❌'} ${testCase.name}`);
    console.log(`   輸入: ${testCase.input}`);
    console.log(`   風險等級: ${result.riskLevel} (預期: ${testCase.expectedRisk})`);
    if (result.keywords.length > 0) {
      console.log(`   檢測到關鍵字: ${result.keywords.join(', ')}`);
    }
    console.log('');
  }

  // 測試輸出過濾
  console.log('\n=== 測試 2：輸出過濾 ===\n');
  for (const testCase of OUTPUT_TEST_CASES) {
    const result = await filterAIOutput(testCase.output);
    const passed = result.isSafe === !testCase.shouldBlock;

    console.log(`${passed ? '✅' : '❌'} ${testCase.name}`);
    console.log(`   輸出: ${testCase.output}`);
    console.log(`   是否安全: ${result.isSafe} (預期: ${!testCase.shouldBlock})`);
    if (!result.isSafe) {
      console.log(`   攔截原因: ${result.reason}`);
      console.log(`   安全回覆: ${result.filteredResponse}`);
    }
    console.log('');
  }

  // 測試安全回覆生成
  console.log('\n=== 測試 3：安全回覆生成 ===\n');
  const safetyTestKeywords = [
    ['退款'],
    ['客訴', '不滿意'],
    ['緊急', '馬上'],
  ];

  for (const keywords of safetyTestKeywords) {
    const response = getSafetyFallbackResponse(keywords);
    console.log(`✅ 關鍵字: ${keywords.join(', ')}`);
    console.log(`   回覆: ${response.substring(0, 50)}...`);
    console.log('');
  }

  console.log('🎉 測試完成！');
}

runTests().catch(console.error);
