#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
サンプルExcelファイル生成スクリプト
"""

import pandas as pd
import os

def create_sample_excel():
    """
    サンプルのExcelファイルを作成
    """
    
    # サンプルデータ
    data = {
        'ID': [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        'ジャンル': ['英単語', '英単語', '英単語', '英単語', '日本史', 
                     '日本史', '日本史', '数学', '数学', '数学'],
        'サブジャンル': ['基礎', '基礎', '応用', '応用', '古代', 
                         '中世', '近代', '算数', '代数', '幾何'],
        '問題': [
            '"apple"の意味は？',
            '"beautiful"の意味は？',
            '"accomplish"の意味は？',
            '"sophisticated"の意味は？',
            '大化の改新が起きた年は？',
            '鎌倉幕府を開いた人物は？',
            '明治維新が始まった年は？',
            '3 × 7 = ?',
            'x + 5 = 12 のとき、x = ?',
            '正三角形の内角の大きさは？'
        ],
        '答え': [
            'りんご',
            '美しい',
            '達成する、成し遂げる',
            '洗練された、高度な',
            '645年',
            '源頼朝',
            '1868年',
            '21',
            '7',
            '60度'
        ],
        '解説': [
            '果物の名前。赤や青のものがある。',
            '人や物の見た目が魅力的なことを表す形容詞。',
            '目標や任務を完了させることを意味する動詞。',
            '複雑で洗練されているさまを表す形容詞。',
            '中大兄皇子と中臣鎌足が蘇我氏を倒した政変。',
            '1192年（いい国作ろう）に征夷大将軍となった。',
            '江戸幕府が終わり、天皇を中心とした新政府が誕生。',
            '九九の基本。3の段の7番目。',
            '方程式の基本。両辺から5を引くと答えが出る。',
            '正三角形は3つの角が等しく、180÷3=60度。'
        ],
        '難易度': [1, 1, 3, 4, 2, 2, 2, 1, 2, 2]
    }
    
    # DataFrameを作成
    df = pd.DataFrame(data)
    
    # Excelファイルとして保存
    output_dir = 'converter'
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
    
    excel_path = os.path.join(output_dir, 'sample_questions.xlsx')
    
    # Excelライターを使用して書き込み
    with pd.ExcelWriter(excel_path, engine='openpyxl') as writer:
        df.to_excel(writer, sheet_name='問題', index=False)
        
        # 列幅を調整
        worksheet = writer.sheets['問題']
        worksheet.column_dimensions['A'].width = 8   # ID
        worksheet.column_dimensions['B'].width = 15  # ジャンル
        worksheet.column_dimensions['C'].width = 15  # サブジャンル
        worksheet.column_dimensions['D'].width = 40  # 問題
        worksheet.column_dimensions['E'].width = 30  # 答え
        worksheet.column_dimensions['F'].width = 50  # 解説
        worksheet.column_dimensions['G'].width = 10  # 難易度
    
    print(f'✅ サンプルExcelファイルを作成しました: {excel_path}')
    return excel_path

def convert_sample_to_json(excel_path):
    """
    サンプルExcelをJSONに変換
    """
    import subprocess
    
    # dataディレクトリを作成
    os.makedirs('data', exist_ok=True)
    
    # 変換コマンドを実行
    result = subprocess.run(
        ['python', 'converter/excel_to_json.py', excel_path, '-o', 'data/questions.json'],
        capture_output=True,
        text=True
    )
    
    if result.returncode == 0:
        print('✅ JSONファイルを作成しました: data/questions.json')
    else:
        print('❌ JSON変換に失敗しました')
        print(result.stderr)

if __name__ == '__main__':
    try:
        # サンプルExcelを作成
        excel_path = create_sample_excel()
        
        # JSONに変換
        convert_sample_to_json(excel_path)
        
    except ImportError as e:
        print('⚠️ 必要なライブラリがインストールされていません:')
        print(f'  {e}')
        print('\n以下のコマンドでインストールしてください:')
        print('pip install pandas openpyxl')
