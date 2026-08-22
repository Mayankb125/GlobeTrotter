# AI Travel Planner

An AI-powered personalized travel planning system that dynamically generates itineraries, optimizes bookings, and assists travelers in real-time using multi-agent coordination.

## 🏗️ Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     AI Travel Planner                        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐         A2A Protocol        ┌───────────┐ │
│  │   CrewAI     │◄────────────────────────────►│    ADK    │ │
│  │    Agent     │  (HMAC-signed messages)      │   Agent   │ │
│  └──────┬───────┘                              └─────┬─────┘ │
│         │                                            │        │
│         │                                            │        │
│         └──────────────┐              ┌─────────────┘        │
│                        │              │                       │
│                  ┌─────▼──────────────▼─────┐                │
│                  │   State Store (In-Mem)   │                │
│                  └──────────────────────────┘                │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │           External Integrations (MCP)                 │   │
│  ├──────────────┬────────────────┬──────────────────────┤   │
│  │ Groq Client  │ Gemini Flash   │ DuckDuckGo Search    │   │
│  └──────────────┴────────────────┴──────────────────────┘   │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │          Monitoring & Observability                   │   │
│  ├──────────────┬────────────────┬──────────────────────┤   │
│  │  Callbacks   │  JSON Logger   │  Event Tracing       │   │
│  └──────────────┴────────────────┴──────────────────────┘   │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Key Components

1. **Multi-Agent System**
   - **CrewAI Agent**: Gathers travel requirements, searches for options (flights, hotels, activities), creates initial proposals
   - **ADK Agent**: Optimizes itineraries for cost, time, and preferences; applies budget constraints

2. **A2A Protocol** (Agent-to-Agent)
   - JSON message envelope with versioning
   - HMAC-SHA256 signatures for message integrity
   - In-memory adapter for local message passing
   - Correlation ID propagation for distributed tracing

3. **State Management**
   - Interface-based design (supports in-memory and Redis)
   - Atomic operations for shared state
   - TTL support for temporary data

4. **External Tool Integration (MCP)**
   - **Groq**: Semantic search and document store
   - **Gemini 2.0 Flash**: Text generation and NLP
   - **DuckDuckGo**: Web search for real-time information
   - **Budget Calculator**: Currency conversion and financial calculations

5. **Monitoring & Observability**
   - Callback-based event system
   - Structured JSON logging
   - MonitoringEvent Pydantic models
   - Trace and correlation ID tracking

6. **Structured Outputs**
   - All data models use Pydantic v2
   - JSON and Markdown export capabilities
   - Type-safe throughout

## 🔗 MCP (Model Context Protocol) Integration

This project implements the **Model Context Protocol** for standardized tool integration and discovery. MCP enables seamless communication between the planning system and external tools with:

### MCP Architecture

```
┌─────────────────────────────────────────────┐
│       Interactive Planner / Workflow        │
└────────────────┬────────────────────────────┘
                 │
        ┌────────▼──────────┐
        │  MCP Client       │
        │  (Tool Registry)  │
        └────────┬──────────┘
                 │
     ┌───────────┼───────────┬──────────────┐
     │           │           │              │
┌────▼──┐  ┌────▼──┐  ┌────▼──┐  ┌────▼──┐
│Gemini │  │ Groq  │  │DuckDu │  │Budget │
│       │  │  LLM  │  │  Go   │  │ Calc  │
│Research  │         │ Search │  │       │
└────────┘  └────────┘  └────────┘  └───────┘
```

### MCP Tools Registry

| Tool | Module | Purpose | Input | Output |
|------|--------|---------|-------|--------|
| `gemini_research` | `mcp_client.py` | Destination research (weather, lodging, attractions) | destination, dates, interests | research result dict |
| `groq_llm` | `mcp_client.py` | Itinerary generation via LLM | prompt, json_mode, temperature | generated itinerary JSON |
| `duckduckgo_search` | `mcp_client.py` | Web search for travel info | query, max_results | search results array |
| `calculator` | `mcp_client.py` | Budget calculations & cost optimization | operation, amounts, currency | calculation result |

### Tool Implementation Files

```
src/integrations/
├── mcp_client.py           # MCP client, tool definitions, registry
├── mcp_tool_adapter.py     # Tool adapters with MCP compliance
├── gemini_research.py      # Gemini research client (invoked via MCP)
├── groq_client.py          # Groq LLM client (invoked via MCP)
├── duckduckgo_client.py    # DuckDuckGo search (invoked via MCP)
└── calculator.py           # Budget calculator (invoked via MCP)
```

### MCP Request/Response Format

**Tool Request:**
```json
{
  "tool_name": "gemini_research",
  "arguments": {
    "destination": "Paris",
    "travel_dates": {
      "start_date": "2025-12-01",
      "end_date": "2025-12-07"
    },
    "interests": ["culture", "art"]
  },
  "trace_id": "trace-abc123",
  "correlation_id": "corr-xyz789"
}
```

**Tool Response:**
```json
{
  "tool_name": "gemini_research",
  "result": {
    "destination": "Paris",
    "weather_summary": "...",
    "accommodation_suggestions": "...",
    "top_attractions": "...",
    "estimated_daily_cost": 150.0,
    "currency": "EUR",
    "travel_tips": "...",
    "best_time_to_visit": "..."
  },
  "error": null,
  "trace_id": "trace-abc123",
  "correlation_id": "corr-xyz789"
}
```

### MCP Tool Discovery & Invocation

**List Available Tools:**
```python
from src.integrations.mcp_client import get_mcp_client

mcp = get_mcp_client()
tools = mcp.list_tools()

for tool in tools:
    print(f"{tool.name}: {tool.description}")
    print(f"  Category: {tool.category}")
    print(f"  Schema: {tool.input_schema}")
```

**Invoke a Tool:**
```python
from src.integrations.mcp_tool_adapter import invoke_mcp_tool
import uuid

response = await invoke_mcp_tool(
    tool_name="gemini_research",
    arguments={
        "destination": "Tokyo",
        "travel_dates": {
            "start_date": "2025-12-20",
            "end_date": "2025-12-27"
        }
    },
    trace_id=str(uuid.uuid4()),
    correlation_id=str(uuid.uuid4())
)

if response.error:
    print(f"Error: {response.error}")
else:
    print(f"Research: {response.result}")
```

### MCP & A2A Protocol Integration

The A2A protocol is MCP-compliant with:
- **Trace ID**: Distributed tracing across tool invocations
- **Correlation ID**: Request correlation for multi-step operations
- **Message Versioning**: Ensures protocol compatibility
- **HMAC Signatures**: Secure tool-to-agent communication

### MCP Compliance Checklist

✅ **Requirement**: At least 2 external tools integrated
- Gemini 2.0 Flash (research)
- Groq LLM (generation)
- DuckDuckGo Search (search fallback)
- Budget Calculator (optimization)

✅ **Tool Discovery**: `MCPClient.list_tools()` exposes all available tools

✅ **Request/Response Format**: Standardized `MCPToolRequest` / `MCPToolResponse` models

✅ **Error Handling**: All tools return structured error responses with trace IDs

✅ **Async Support**: All tool adapters are fully async-compatible

## 🚀 Getting Started

### Prerequisites

- Python 3.9 or higher
- pip (Python package manager)

### Installation

1. **Clone or navigate to the repository**

```bash
cd ai-travel-planner
```

2. **Set up environment**

On Linux/macOS:
```bash
chmod +x scripts/local_run.sh
./scripts/local_run.sh
```

On Windows:
```powershell
# Create virtual environment
python -m venv venv

# Activate virtual environment
.\venv\Scripts\Activate.ps1

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt
```

3. **Configure environment variables**

Copy `.env.example` to `.env` and fill in your API keys:

```bash
cp .env.example .env
```

Edit `.env` with your actual API keys:
- `GROQ_API_KEY`: Your Groq API key
- `GEMINI_API_KEY`: Your Google Gemini API key
- `CREWAI_API_KEY`: Your CrewAI API key (if using real CrewAI)
- `ADK_API_KEY`: Your ADK API key (if using real ADK)
- `A2A_SHARED_SECRET`: Secret for HMAC message signing (change from default!)
- Other API keys as needed

### Running the Application

**Demo mode with sample request:**

```bash
python -m src.main examples/sample_itinerary_request.json
```

**With your own request file:**

```bash
python -m src.main path/to/your/request.json
```

The application will:
1. Load traveler profile and preferences
2. Coordinate agents via A2A protocol
3. Invoke research tool via MCP (Gemini)
4. Generate itinerary via MCP (Groq LLM)
5. Output both JSON and Markdown formats
6. Save results to `examples/generated_itinerary.*`

### Interactive Mode (Guided Conversation)

Use the interactive planner to be prompted for origin, destination, dates, budget, and preferences. It will then perform research, generate a proposal, optimize it, and save timestamped outputs including embedded research.

Windows PowerShell:
```powershell
& .\myenv\Scripts\Activate.ps1
python -m src.interactive_planner
```

Example flow:
1. You are prompted for trip basics (origin, destination, start/end dates, budget, interests)
2. Gemini research runs (weather, lodging ranges, attractions, local tips, indicative costs)
3. CrewAI planner produces an initial structured itinerary
4. ADK optimizer adjusts cost/timing while preserving structure
5. Time ranges are parsed into per-activity `start_time` / `end_time` datetimes
6. Files saved: `examples/itinerary_<destination>_<YYYYMMDD_HHMMSS>.json` + `.md`, plus research markdown

Outputs now include:
- Embedded research block in both JSON and Markdown
- "At-a-Glance" summary (days, total estimated spend, primary themes)
- "Top Attractions" highlight list
- Accurate daily activity time ranges (no longer all midnight)
- Consistent cost breakdown with total propagated through optimization

If you cancel mid-run, partial research may still save; rerun to regenerate a full itinerary.

## 🧪 Testing

### Run all tests

```bash
pytest
```

### Run with coverage

```bash
pytest --cov=src --cov-report=html
```

### Run specific test files

```bash
pytest src/tests/test_models.py
pytest src/tests/test_a2a_protocol.py
pytest src/tests/test_integration.py
```

### Test coverage includes:

- ✅ Pydantic model validation and serialization
- ✅ A2A HMAC signature signing and verification
- ✅ State store operations (set, get, delete, list)
- ✅ Monitoring callbacks and event emission
- ✅ End-to-end workflow integration

## 📋 Project Structure

```
ai-travel-planner/
├── .env                          # Environment variables (gitignored)
├── .env.example                  # Environment template
├── .gitignore                    # Git ignore rules
├── pyproject.toml                # Project metadata
├── requirements.txt              # Python dependencies
├── README.md                     # This file
│
├── envs/
│   └── .env.ci                   # CI environment variables
│
├── src/
│   ├── main.py                   # Application entry point
│   │
│   ├── config/
│   │   └── settings.py           # Pydantic settings
│   │
│   ├── models/
│   │   └── itinerary.py          # All Pydantic models
│   │
│   ├── a2a/
│   │   ├── protocol.py           # A2A message protocol
│   │   └── adapters/
│   │       └── in_memory.py      # In-memory message adapter
│   │
│   ├── state/
│   │   └── store.py              # State store interface & impl
│   │
│   ├── integrations/
│   │   ├── groq_client.py        # Groq API wrapper
│   │   ├── gemini_flash_client.py # Gemini API wrapper
│   │   ├── duckduckgo_client.py  # DuckDuckGo wrapper
│   │   └── calculator.py         # Currency & budget utils
│   │
│   ├── agents/
│   │   ├── crewai_agent/
│   │   │   ├── agent.py          # CrewAI agent wrapper
│   │   │   └── handlers.py       # Lifecycle handlers
│   │   └── adk_agent/
│   │       └── agent.py          # ADK agent wrapper
│   │
│   ├── callbacks/
│   │   ├── monitoring.py         # Monitoring callbacks
│   │   └── logger_adapter.py     # Logger adapter
│   │
│   ├── logging/
│   │   └── json_logger.py        # Structured JSON logger
│   │
│   ├── workflows/
│   │   └── dynamic_planner.py    # Workflow orchestration
│   │
│   └── tests/
│       ├── conftest.py           # Test configuration
│       ├── test_models.py        # Model tests
│       ├── test_a2a_protocol.py  # A2A protocol tests
│       ├── test_state_store.py   # State store tests
│       ├── test_callbacks.py     # Callback tests
│       └── test_integration.py   # Integration tests
│
├── examples/
│   ├── sample_itinerary_request.json  # Sample input
│   ├── sample_a2a_trace.json         # Sample A2A trace
│   ├── generated_itinerary.json      # Generated output (JSON)
│   └── generated_itinerary.md        # Generated output (Markdown)
│
├── scripts/
│   ├── local_run.sh              # Local development script
│   ├── db_migrate.py             # Database migration stub
│   └── seed_demo_data.py         # Demo data seeder
│
└── ops/
    └── commit_history_example.txt # Sample commit history

### Output Naming Pattern

Generated itinerary and research files follow:
```
itinerary_<destination>_<YYYYMMDD_HHMMSS>.json
itinerary_<destination>_<YYYYMMDD_HHMMSS>.md
research_<destination>_<YYYYMMDD_HHMMSS>.md
```
Ensures no overwrites across runs.

### Recent Enhancements

- Time Range Parsing: Activities now reflect scheduled ranges like "09:00 AM - 11:00 AM" instead of defaulting to midnight. Duration is computed as the difference between parsed start and end times.
- Embedded Research: Weather, lodging ranges, attraction summaries, local tips, and indicative costs are stored alongside itinerary output (JSON + Markdown).
- At-a-Glance & Highlights: Quick summary section plus top attractions list in Markdown for rapid scanning.
- Optimization Routing Fixes: ADK optimized plan now reliably stored/retrieved via multiple state keys fallback.
- Serialization Improvements: Robust handling of `Decimal` and `datetime` objects in prompts and outputs.
- Unique Filenames: Timestamp + destination prevents accidental overwrites during iterative planning.
- Resilient JSON Parsing: Fallback logic handles truncated or malformed LLM JSON responses without losing prior valid data.

### Time Parsing Details

The workflow attempts to parse activity time strings of the form:
```
HH:MM AM - HH:MM PM
```
If parsing fails, a safe fallback window (09:00–10:00) is used and logged. Activities are anchored to `start_date + (day_index)` so day offsets are respected.

### Monitoring Log Warning (FYI)

If you see repeated messages like:
```
Attempt to overwrite 'message' in LogRecord
```
This stems from a logger adapter assigning `message` explicitly. It is cosmetic; to silence it, adjust the adapter to use a different key (e.g., `original_message`) or avoid overriding `record.message`.

### Planned Next Steps (Suggested)

- Suppress cosmetic logging warnings
- Add JSON highlights array mirroring Markdown top attractions
- Improve LLM JSON schema validation (streamed chunk assembly)
- Add currency conversion for per-day spend vs total
- Optional Redis state backend for multi-session continuity

---
```

## 🔐 Security Notes

### Environment Variables

**CRITICAL**: Never commit `.env` files to version control!

- `.env` is in `.gitignore` by default
- Use `.env.example` as a template
- Store sensitive keys in secure vaults (e.g., AWS Secrets Manager, Azure Key Vault)

### A2A Message Security

- All A2A messages are HMAC-signed using `A2A_SHARED_SECRET`
- Change the default secret in production
- Use strong, randomly generated secrets (32+ characters)
- Rotate secrets periodically

### API Keys

- Replace all placeholder API keys before production use
- Use different keys for dev/test/prod environments
- Monitor API usage for anomalies
- Set up rate limiting and budget alerts

### File Permissions

On Linux/macOS, set restrictive permissions:

```bash
chmod 600 .env
```

## 🔧 Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `APP_ENV` | No | `development` | Environment name |
| `LOG_LEVEL` | No | `INFO` | Logging level |
| `SECRET_KEY` | Yes | - | Application secret key |
| `A2A_SHARED_SECRET` | Yes | - | A2A HMAC signing secret |
| `GROQ_API_KEY` | No | - | Groq API key |
| `GEMINI_API_KEY` | No | - | Gemini API key |
| `GEMINI_MODEL` | No | `gemini-2.0-flash` | Gemini model name |
| `CREWAI_API_KEY` | No | - | CrewAI API key |
| `ADK_API_KEY` | No | - | ADK API key |
| `STATE_BACKEND` | No | `inmemory` | State backend (inmemory/redis) |
| `REDIS_URL` | No | - | Redis connection URL |
| `ENABLE_MONITORING` | No | `true` | Enable monitoring |
| `ALLOW_BOOKING_OPERATIONS` | No | `false` | Allow real bookings |
| `DEFAULT_CURRENCY` | No | `USD` | Default currency |
| `BUDGET_ALERT_THRESHOLD` | No | `0.9` | Budget alert threshold |

## 📡 A2A Protocol Contract

### Message Envelope

```json
{
  "message_id": "unique-uuid",
  "trace_id": "distributed-trace-id",
  "correlation_id": "request-correlation-id",
  "message_type": "proposal|optimized_plan|query|response|error",
  "version": "1.0",
  "timestamp": "2026-08-22T10:30:00Z",
  "payload": {
    "...message-specific-data..."
  },
  "meta": {
    "sender": "agent-id",
    "receiver": "agent-id",
    "priority": 5,
    "ttl": 300
  },
  "signature": "hmac-sha256-hex-signature"
}
```

### Message Types

- **proposal**: Initial travel proposal from CrewAI agent
- **optimized_plan**: Optimized plan from ADK agent
- **query**: Request for information
- **response**: Response to query
- **error**: Error notification

### Signature Verification

Messages are signed using HMAC-SHA256:

```python
from a2a.protocol import sign_message, verify_message

# Sign
signed_msg = sign_message(message)

# Verify
is_valid = verify_message(signed_msg)
```

## 🎯 API Integration Notes

### Groq API

- Replace stub implementation in `src/integrations/groq_client.py`
- Add actual endpoint URLs and authentication
- Implement retry logic for production

### Gemini 2.0 Flash

- Uses `google-generativeai` package (not installed by default)
- Set `GEMINI_API_KEY` in environment
- Supports both synchronous and streaming modes

### DuckDuckGo

- Public HTML interface (no API key required)
- Consider using `duckduckgo-search` package for production
- Alternative: Use Bing or Google Custom Search APIs

### CrewAI / ADK

- Current implementation uses stubs
- Install actual packages when available:
  ```bash
  pip install crewai
  pip install adk
  ```
- Update agent wrappers with real API calls

## 🧩 Extending the System

### Adding a New Agent

1. Create agent directory: `src/agents/new_agent/`
2. Implement agent class with A2A support
3. Register with workflow orchestrator
4. Add tests

### Adding External Tools

1. Create client wrapper in `src/integrations/`
2. Implement typed request/response models
3. Add retry and error handling
4. Write unit tests

### Custom State Backends

Implement the `StateStore` interface:

```python
from state.store import StateStore

class CustomStateStore(StateStore):
    async def get(self, key: str) -> Optional[Any]: ...
    async def set(self, key: str, value: Any, ttl: Optional[int] = None) -> bool: ...
    # ... implement other methods
```

## 📊 Monitoring

### Structured Logs

Logs are written in JSON format with correlation IDs:

```json
{
  "timestamp": "2026-08-22T10:30:00Z",
  "level": "INFO",
  "logger": "src.workflows.dynamic_planner",
  "message": "Starting planning workflow",
  "trace_id": "trace-abc",
  "correlation_id": "corr-xyz",
  "task_id": "task-001"
}
```

### Monitoring Events

Events are emitted to `monitoring_events.json`:

```json
{
  "event_id": "evt-001",
  "event_type": "task_start",
  "severity": "info",
  "trace_id": "trace-abc",
  "correlation_id": "corr-xyz",
  "task_id": "task-001",
  "agent_id": "crewai-planner",
  "message": "Task started"
}
```

## 🐛 Troubleshooting

### Common Issues

**Import errors:**
```bash
# Ensure you're in the project root and virtual environment is activated
python -m src.main examples/sample_itinerary_request.json
```

**Missing API keys:**
- Check `.env` file exists and has correct values
- Stub implementations work without real API keys

**Tests failing:**
```bash
# Ensure test dependencies are installed
pip install -r requirements.txt
```

**State store errors:**
- Default is in-memory (no external dependencies)
- For Redis, ensure Redis server is running

**All activity times show 12:00 AM:**
- Ensure you are running the updated workflow with time range parsing (post-enhancement). Reinstall dependencies and rerun `python -m src.interactive_planner`.
- Verify the LLM is returning time ranges in the daily schedule (enable debug logging if needed).

**Missing research in JSON:**
- Confirm interactive mode was used (non-interactive main may exclude certain embedding steps depending on version).
- Ensure environment variable `ENABLE_MONITORING=true` does not interfere (it should not, but check logs for early exceptions).

## 📚 Additional Resources

- [Pydantic Documentation](https://docs.pydantic.dev/)
- [httpx Documentation](https://www.python-httpx.org/)
- [pytest Documentation](https://docs.pytest.org/)

## 📝 License

MIT License - see LICENSE file for details

## 🤝 Contributing

This is a demonstration/scaffold project. In production:

1. Replace stub implementations with real API calls
2. Add comprehensive error handling
3. Implement rate limiting
4. Add authentication and authorization
5. Set up CI/CD pipelines
6. Add monitoring and alerting
7. Implement database persistence
8. Add caching layer
9. Implement booking confirmation workflows
10. Add user interface (web/mobile)

## 📞 Support

For issues and questions, please check:
- Project documentation
- Test files for usage examples
- Code comments and docstrings

---

**Note**: This is a skeleton implementation for demonstration purposes. External API calls are stubbed and will return mock data unless you provide valid API keys and update the client implementations.
