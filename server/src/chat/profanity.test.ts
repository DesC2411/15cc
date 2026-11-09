import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createFilter, sanitize } from './profanity.ts'
import { loadContent } from '../content.ts'

const filter = createFilter(loadContent().chatFilter)
const clean = (s: string) => filter(s).flagged === false

test('che từ bậy có dấu, không dấu, viết tắt', () => {
  assert.equal(filter('đm thằng này').text, '** thằng này')
  assert.equal(filter('vcl').text, '***')
  assert.ok(filter('ĐỊT').flagged)
  assert.ok(filter('Fuck you').flagged)
})

test('lách bằng ký tự chèn, leet, chữ lặp', () => {
  assert.ok(filter('đ.m').flagged)
  assert.ok(filter('v_c_l').flagged)
  assert.ok(filter('vcllllll').flagged)
  assert.ok(filter('f*ck').flagged) // bỏ * → "fck"
  assert.ok(filter('fuuuuck').flagged)
  assert.ok(filter('sh1t').flagged)
  assert.ok(filter('đmmmmm').flagged)
})

test('che cụm từ, giữ nguyên phần còn lại', () => {
  assert.equal(filter('mày đúng là óc chó!').text, 'mày đúng là ** ***!')
  assert.ok(filter('Đồ   ngu').flagged)
})

test('không che nhầm từ thường', () => {
  for (const s of [
    'Nhà hát lớn đẹp quá',
    'các bạn ơi đi du lịch không',
    'buổi tối đi ngủ sớm',
    'nha hat lon dep qua',
    'cac ban oi di ngu thoi',
    'đeo kính vào',
    'c ơi đợi e với',
    'class học lúc 8h',
    'con chó nhà mình dễ thương',
    'Hải Phòng có bánh đa cua',
    'dịch vụ tốt',
    'cool',
  ]) {
    assert.ok(clean(s), `che nhầm: "${s}" → "${filter(s).text}"`)
  }
})

test('sanitize bỏ ký tự vô hình và gộp khoảng trắng', () => {
  assert.equal(sanitize('  xin​   chào \n bạn '), 'xin chào bạn')
})
