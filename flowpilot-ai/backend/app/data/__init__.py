"""数据访问层。

分层：
- models: ORM 模型定义
- database: 连接、会话、建表
- content_plan_repository: 内容计划仓储（抽象 + JSON + SQLAlchemy 实现）
- rule_repository: 规则中心仓储（抽象 + JSON 实现）
- repository_factory: 按环境选择实现，失败降级
"""
