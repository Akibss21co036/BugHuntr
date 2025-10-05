"""Local fallback package for emergentintegrations used by the app when
the real `emergentintegrations` package is not installed.

This file makes `emergentintegrations` a package so imports like
`from emergentintegrations.llm.chat import LlmChat` work.
"""

__all__ = ["llm"]
