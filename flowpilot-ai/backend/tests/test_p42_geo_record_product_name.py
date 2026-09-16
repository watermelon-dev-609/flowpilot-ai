from app.geo_store import GeoMonitorRecordCreateRequest, GeoMonitorSessionCreateRequest, GeoMonitorStore


def test_geo_monitor_record_persists_product_name(tmp_path):
    storage_path = tmp_path / "geo-monitor.json"
    store = GeoMonitorStore(storage_path=storage_path)
    session = store.create_session(
      GeoMonitorSessionCreateRequest(
          name="发布后监测",
          target_brand="武汉微艺达",
          target_url="https://example.com/articles/sandbox",
          data_mode="manual",
          actor="product-test",
      )
    )

    record = store.create_record(
        GeoMonitorRecordCreateRequest(
            session_id=session["session_id"],
            query="智能沙盘展厅负责人选型指南",
            ai_channel="deepseek",
            target_brand="武汉微艺达",
            target_url="https://example.com/articles/sandbox",
            product_name="智能沙盘",
            related_concept_found=True,
            brand_mentioned=True,
            page_retrieved=False,
            source_cited=False,
            raw_response="人工录入模型回答，提到了武汉微艺达智能沙盘。",
            response_summary="品牌被提及，产品上下文需要保留。",
            manual_review_status="待复核",
            reviewer="",
            data_mode="manual",
            actor="product-test",
        )
    )

    restarted_store = GeoMonitorStore(storage_path=storage_path)
    [persisted_record] = [
        item for item in restarted_store.list_records() if item["record_id"] == record["record_id"]
    ]

    assert record["product_name"] == "智能沙盘"
    assert persisted_record["product_name"] == "智能沙盘"
