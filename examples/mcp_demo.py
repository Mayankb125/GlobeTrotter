"""
MCP Integration Demo Script.

Demonstrates the Model Context Protocol tool integration in action.
This script shows how to discover, list, and invoke MCP tools.
"""

import asyncio
import sys
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from src.integrations.mcp_client import get_mcp_client
from src.integrations.mcp_tool_adapter import invoke_mcp_tool
import uuid


async def demo_mcp_discovery():
    """Demonstrate MCP tool discovery."""
    print("\n" + "="*60)
    print("MCP TOOL DISCOVERY")
    print("="*60)
    
    mcp = get_mcp_client()
    tools = mcp.list_tools()
    
    print(f"\n✅ Found {len(tools)} MCP tools:\n")
    
    for i, tool in enumerate(tools, 1):
        print(f"{i}. {tool.name}")
        print(f"   Category: {tool.category}")
        print(f"   Description: {tool.description}")
        print(f"   Input Schema: {list(tool.input_schema.get('properties', {}).keys())}")
        print()


async def demo_mcp_invocation():
    """Demonstrate MCP tool invocation."""
    print("\n" + "="*60)
    print("MCP TOOL INVOCATION DEMO")
    print("="*60)
    
    trace_id = str(uuid.uuid4())[:8]
    correlation_id = str(uuid.uuid4())[:8]
    
    # Demo 1: Calculator tool
    print(f"\n📊 Demo 1: Calculator Tool")
    print(f"   Trace ID: {trace_id}")
    print(f"   Correlation ID: {correlation_id}")
    
    response = await invoke_mcp_tool(
        tool_name="calculator",
        arguments={
            "operation": "total_cost",
            "amounts": [1500, 2000, 1200]
        },
        trace_id=trace_id,
        correlation_id=correlation_id
    )
    
    print(f"   Result: {response.result}")
    print(f"   Error: {response.error}")
    
    # Demo 2: Per-day calculation
    print(f"\n📊 Demo 2: Per-Day Cost Calculation")
    
    response = await invoke_mcp_tool(
        tool_name="calculator",
        arguments={
            "operation": "per_day",
            "amounts": [5000],
            "num_days": 7
        },
        trace_id=trace_id,
        correlation_id=correlation_id
    )
    
    print(f"   Result: {response.result}")
    print(f"   Error: {response.error}")


async def demo_mcp_schema():
    """Demonstrate MCP tool schema validation."""
    print("\n" + "="*60)
    print("MCP TOOL SCHEMA INSPECTION")
    print("="*60)
    
    mcp = get_mcp_client()
    
    # Show Gemini research schema
    gemini_tool = mcp.get_tool_definition("gemini_research")
    print(f"\n🔍 Gemini Research Tool Schema:")
    print(f"   Properties: {list(gemini_tool.input_schema['properties'].keys())}")
    print(f"   Required: {gemini_tool.input_schema.get('required', [])}")
    
    # Show Groq LLM schema
    groq_tool = mcp.get_tool_definition("groq_llm")
    print(f"\n🤖 Groq LLM Tool Schema:")
    print(f"   Properties: {list(groq_tool.input_schema['properties'].keys())}")
    print(f"   Required: {groq_tool.input_schema.get('required', [])}")


async def main():
    """Run all demos."""
    print("\n🚀 MCP Integration Test Suite")
    print("=" * 60)
    
    try:
        await demo_mcp_discovery()
        await demo_mcp_schema()
        await demo_mcp_invocation()
        
        print("\n" + "="*60)
        print("✅ ALL MCP INTEGRATION TESTS PASSED!")
        print("="*60)
        
    except Exception as e:
        print(f"\n❌ Error during MCP demo: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
