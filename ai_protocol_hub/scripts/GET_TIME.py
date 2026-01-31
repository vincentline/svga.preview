#!/usr/bin/env python3
"""
GET_TIME.py - 获取准确北京时间的Python脚本
功能：获取北京标准时间，输出格式为 [YYYY-MM-DD HH:MM:SS]
作者：AI-HLP
日期：2026-01-31
"""

import datetime
import sys
import time


def get_beijing_time():
    """
    获取北京时间
    
    返回：
        str: 格式化的北京时间字符串，格式为 [YYYY-MM-DD HH:MM:SS]
    """
    try:
        # 获取本地时间
        local_time = datetime.datetime.now()
        # 获取本地时区偏移量（小时）
        offset_hours = datetime.datetime.now().astimezone().utcoffset().total_seconds() / 3600
        # 转换为UTC时间
        utc_time = local_time - datetime.timedelta(hours=offset_hours)
        # 转换为北京时间（UTC+8）
        beijing_time = utc_time + datetime.timedelta(hours=8)
        # 格式化输出
        formatted_time = beijing_time.strftime("[%Y-%m-%d %H:%M:%S]")
        print(f"使用本地时间转换：{formatted_time}")
        return formatted_time
    except Exception as e:
        print(f"错误：无法获取时间")
        print(f"错误信息：{str(e)}")
        # 最简单的备选方案：直接使用本地时间
        try:
            local_time = datetime.datetime.now()
            formatted_time = local_time.strftime("[%Y-%m-%d %H:%M:%S]")
            print(f"使用本地时间备选：{formatted_time}")
            return formatted_time
        except:
            # 终极备选：返回当前时间戳的字符串表示
            return f"[{time.strftime('%Y-%m-%d %H:%M:%S')}]"


if __name__ == "__main__":
    time_str = get_beijing_time()
    if time_str:
        print(time_str)
        sys.exit(0)
    else:
        sys.exit(1)
