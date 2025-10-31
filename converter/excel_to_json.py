#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Excel → JSON 変換ツール
クイズアプリ用の問題データをExcelからJSON形式に変換します
"""

import json
import sys
import os
from datetime import datetime
import pandas as pd
import argparse

def excel_to_json(excel_path, output_path=None):
    """
    ExcelファイルをJSON形式に変換
    
    Args:
        excel_path: 入力Excelファイルのパス
        output_path: 出力JSONファイルのパス（省略時は自動生成）
    
    Returns:
        bool: 成功時True、失敗時False
    """
    
    try:
        # Excelファイルの読み込み
        print(f"📖 Excelファイルを読み込んでいます: {excel_path}")
        df = pd.read_excel(excel_path)
        
        # 必須列のチェック
        required_columns = ['ID', 'ジャンル', '問題', '答え', '解説']
        missing_columns = [col for col in required_columns if col not in df.columns]
        
        if missing_columns:
            print(f"❌ エラー: 必須列が不足しています: {missing_columns}")
            print("必須列: ID, ジャンル, 問題, 答え, 解説")
            return False
        
        # データのクレンジング
        df['ID'] = df['ID'].astype(int)
        df = df.fillna('')  # NaNを空文字に変換
        
        # 問題データの作成
        questions = []
        for _, row in df.iterrows():
            question = {
                'id': int(row['ID']),
                'genre': str(row['ジャンル']),
                'question': str(row['問題']),
                'answer': str(row['答え']),
                'explanation': str(row['解説'])
            }
            
            # オプション列の追加
            if 'サブジャンル' in df.columns and row['サブジャンル']:
                question['subgenre'] = str(row['サブジャンル'])
            
            if '補足' in df.columns and row['補足']:
                question['supplement'] = str(row['補足'])
            
            if '難易度' in df.columns and row['難易度']:
                try:
                    question['difficulty'] = int(row['難易度'])
                except:
                    pass
            
            questions.append(question)
        
        # ジャンルリストの作成
        genres = df['ジャンル'].unique().tolist()
        
        # メタデータの作成
        metadata = {
            'version': '1.0',
            'lastUpdated': datetime.now().strftime('%Y-%m-%d'),
            'totalQuestions': len(questions)
        }
        
        # 最終的なJSONデータ
        json_data = {
            'questions': questions,
            'genres': genres,
            'metadata': metadata
        }
        
        # 出力パスの決定
        if output_path is None:
            base_name = os.path.splitext(os.path.basename(excel_path))[0]
            output_path = f"{base_name}.json"
        
        # JSONファイルの書き込み
        print(f"💾 JSONファイルを作成しています: {output_path}")
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(json_data, f, ensure_ascii=False, indent=2)
        
        # 統計情報の表示
        print("\n✅ 変換完了！")
        print(f"📊 統計情報:")
        print(f"  - 総問題数: {len(questions)}")
        print(f"  - ジャンル数: {len(genres)}")
        print(f"  - ジャンル内訳:")
        for genre in genres:
            count = df[df['ジャンル'] == genre].shape[0]
            print(f"    - {genre}: {count}問")
        
        # 補足がある問題の数をカウント
        if '補足' in df.columns:
            supplement_count = df[df['補足'].notna() & (df['補足'] != '')].shape[0]
            if supplement_count > 0:
                print(f"  - 補足付き問題: {supplement_count}問")
        
        return True
        
    except FileNotFoundError:
        print(f"❌ エラー: ファイルが見つかりません: {excel_path}")
        return False
    except Exception as e:
        print(f"❌ エラーが発生しました: {str(e)}")
        return False

def validate_json(json_path):
    """
    生成されたJSONファイルの検証
    
    Args:
        json_path: 検証するJSONファイルのパス
    
    Returns:
        bool: 検証成功時True、失敗時False
    """
    try:
        with open(json_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # 必須キーのチェック
        if 'questions' not in data or 'genres' not in data or 'metadata' not in data:
            print("❌ JSONファイルの構造が不正です")
            return False
        
        # 問題データのチェック
        for q in data['questions']:
            required_keys = ['id', 'genre', 'question', 'answer', 'explanation']
            if not all(key in q for key in required_keys):
                print(f"❌ 問題ID {q.get('id', '?')} のデータが不完全です")
                return False
        
        print("✅ JSONファイルの検証成功！")
        return True
        
    except Exception as e:
        print(f"❌ JSONファイルの検証エラー: {str(e)}")
        return False

def main():
    """メイン処理"""
    parser = argparse.ArgumentParser(
        description='Excel形式のクイズ問題をJSON形式に変換します'
    )
    parser.add_argument(
        'input',
        help='入力Excelファイル（.xlsx）'
    )
    parser.add_argument(
        '-o', '--output',
        help='出力JSONファイル名（省略時は入力ファイル名.json）',
        default=None
    )
    parser.add_argument(
        '-v', '--validate',
        action='store_true',
        help='変換後にJSONファイルを検証する'
    )
    
    args = parser.parse_args()
    
    # 変換実行
    if excel_to_json(args.input, args.output):
        output_path = args.output or f"{os.path.splitext(args.input)[0]}.json"
        
        # 検証実行
        if args.validate:
            validate_json(output_path)
        
        print(f"\n📁 出力ファイル: {output_path}")
        print("🎉 変換処理が完了しました！")
        return 0
    else:
        return 1

if __name__ == '__main__':
    sys.exit(main())