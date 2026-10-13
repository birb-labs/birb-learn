import type { LuaEngine, LuaFactory } from 'wasmoon';
import type { Emit, EngineEnv, EngineFactory } from './types';

// The student's source is never part of this code: it is passed to the scripts
// below as a global, which they read and clear before the program starts. The
// scripts keep everything they need in locals, so the program cannot reach or
// shadow it, and a fresh Lua state per case means nothing it changes can leak.
const COMPILE_SCRIPT = String.raw`
local source, load = __birb_source, load
__birb_source = nil
local chunk, message = load(source, '=main.lua', 't')
return message
`;

const RUN_SCRIPT = String.raw`
local source, stdin, emit, finish = __birb_source, __birb_stdin, __birb_emit, __birb_finish
__birb_source, __birb_stdin, __birb_emit, __birb_finish = nil, nil, nil, nil

-- Every global the code below uses is captured here. The program may reassign or
-- remove any global (even set a metatable on _G), and this code must not notice.
local type, select, tostring, tonumber, error, setmetatable, getmetatable, load, pcall =
  type, select, tostring, tonumber, error, setmetatable, getmetatable, load, pcall
local string_sub, string_find, string_byte, string_match =
  string.sub, string.find, string.byte, string.match
local table_concat, table_pack, table_unpack = table.concat, table.pack, table.unpack
local math_tointeger = math.tointeger

local NO_FILES = 'file system access is not available'

-- Output ---------------------------------------------------------------------

-- A character may arrive split across two writes. The bytes of an unfinished
-- UTF-8 sequence are held back until the rest comes, so the host never decodes half.
local held = { stdout = '', stderr = '' }

-- Set by os.exit; once set, it decides the exit code and later output is discarded.
local exit_code = nil

local function incomplete_tail(text)
  local length = #text
  for back = 1, length < 3 and length or 3 do
    local byte = string_byte(text, length - back + 1)
    if byte < 0x80 then return 0 end
    if byte >= 0xC0 then
      local expected = byte >= 0xF0 and 4 or (byte >= 0xE0 and 3 or 2)
      return back < expected and back or 0
    end
  end
  return 0
end

local function write_stream(stream, text)
  if exit_code ~= nil then return end
  text = held[stream] .. text
  local keep = incomplete_tail(text)
  if keep > 0 then
    held[stream] = string_sub(text, -keep)
    text = string_sub(text, 1, #text - keep)
  else
    held[stream] = ''
  end
  if text ~= '' then emit(stream, text) end
end

local function flush_stream(stream)
  local rest = held[stream]
  held[stream] = ''
  if rest ~= '' then emit(stream, rest) end
end

local function flush_streams()
  flush_stream('stdout')
  flush_stream('stderr')
end

local function join(separator, ...)
  local parts = {}
  for index = 1, select('#', ...) do parts[index] = tostring((select(index, ...))) end
  return table_concat(parts, separator)
end

-- Input ----------------------------------------------------------------------

local position = 1

local function read_line(keep_newline)
  if position > #stdin then return nil end
  local newline = string_find(stdin, '\n', position, true)
  local line
  if newline then
    line = string_sub(stdin, position, keep_newline and newline or newline - 1)
    position = newline + 1
  else
    line = string_sub(stdin, position)
    position = #stdin + 1
  end
  return line
end

local function read_number()
  local line = read_line(false)
  if line == nil then return nil end
  return tonumber(line)
end

local function read_all()
  local rest = string_sub(stdin, position)
  position = #stdin + 1
  return rest
end

local function read_bytes(count)
  if position > #stdin then return nil end
  local chunk = string_sub(stdin, position, position + count - 1)
  position = position + #chunk
  return chunk
end

local line_readers = {
  l = function() return read_line(false) end,
  L = function() return read_line(true) end,
  n = read_number,
  a = read_all,
}

local function read_formats(...)
  local count = select('#', ...)
  if count == 0 then return read_line(false) end
  local results = {}
  for index = 1, count do
    local format = select(index, ...)
    local value
    if type(format) == 'number' then
      value = read_bytes(math_tointeger(format) or 0)
    else
      local reader = type(format) == 'string' and line_readers[string_match(format, '^%*?(.)')]
      if not reader then error("bad argument #" .. index .. " to 'read' (invalid format)", 2) end
      value = reader()
    end
    results[index] = value
    -- Like the real library, stop at the first format that finds nothing.
    if value == nil then return table_unpack(results, 1, index) end
  end
  return table_unpack(results, 1, count)
end

local function read_lines(...)
  local formats = table_pack(...)
  return function() return read_formats(table_unpack(formats, 1, formats.n)) end
end

-- Files and the io library ---------------------------------------------------

local function new_file(methods)
  return setmetatable({}, { __index = methods, __name = 'FILE*' })
end

local function write_values(stream, file, ...)
  for index = 1, select('#', ...) do write_stream(stream, tostring((select(index, ...)))) end
  return file
end

local function bad_descriptor()
  return nil, 'Bad file descriptor', 9
end

local function output_methods(stream)
  return {
    write = function(self, ...) return write_values(stream, self, ...) end,
    read = bad_descriptor,
    lines = function() error('file not opened for reading', 2) end,
    flush = function(self) return self end,
    setvbuf = function() return true end,
    seek = function() return nil, 'Illegal seek', 29 end,
    close = function() return true end,
  }
end

local stdin_file = new_file({
  read = function(self, ...) return read_formats(...) end,
  lines = function(self, ...) return read_lines(...) end,
  write = bad_descriptor,
  flush = function(self) return self end,
  setvbuf = function() return true end,
  seek = function() return nil, 'Illegal seek', 29 end,
  close = function() return true end,
})
local stdout_file = new_file(output_methods('stdout'))
local stderr_file = new_file(output_methods('stderr'))

local function refuse_open(name)
  return nil, tostring(name) .. ': ' .. NO_FILES, 1
end

local student_io = {
  stdin = stdin_file,
  stdout = stdout_file,
  stderr = stderr_file,
  read = read_formats,
  write = function(...) return write_values('stdout', stdout_file, ...) end,
  lines = function(name, ...)
    if name ~= nil then error(tostring(name) .. ': ' .. NO_FILES, 2) end
    return read_lines(...)
  end,
  open = refuse_open,
  popen = function() error('io.popen: ' .. NO_FILES, 2) end,
  tmpfile = function() error('io.tmpfile: ' .. NO_FILES, 2) end,
  input = function(name)
    if name ~= nil then error(tostring(name) .. ': ' .. NO_FILES, 2) end
    return stdin_file
  end,
  output = function(name)
    if name ~= nil then error(tostring(name) .. ': ' .. NO_FILES, 2) end
    return stdout_file
  end,
  close = function() return true end,
  flush = function() return stdout_file end,
  type = function(value)
    if value == stdin_file or value == stdout_file or value == stderr_file then return 'file' end
    return nil
  end,
}

-- Process control ------------------------------------------------------------

-- os.exit records the exit code and unwinds the program with a unique error
-- value. pcall, xpcall and coroutine.resume are the real ones (wrapping them
-- would change error levels and add frames), so a program can swallow that
-- error and keep running. It cannot undo the exit, though: the first recorded
-- code decides the result, whatever else happens, and output written after the
-- exit is discarded.
local EXIT = {}

local function student_exit(code)
  if exit_code ~= nil then error(EXIT, 0) end
  if code == nil or code == true then
    exit_code = 0
  elseif code == false then
    exit_code = 1
  else
    local number = math_tointeger(tonumber(code))
    if number == nil then error("bad argument #1 to 'exit' (integer expected)", 2) end
    -- Like a process exit status.
    exit_code = number & 0xFF
  end
  error(EXIT, 0)
end

local warnings_enabled = false

local function student_warn(...)
  local message = join('', ...)
  if select('#', ...) == 1 and string_sub(message, 1, 1) == '@' then
    if message == '@on' then warnings_enabled = true elseif message == '@off' then warnings_enabled = false end
    return
  end
  if warnings_enabled then write_stream('stderr', 'Lua warning: ' .. message .. '\n') end
end

-- Installation ---------------------------------------------------------------

print = function(...) write_stream('stdout', join('\t', ...) .. '\n') end
warn = student_warn
io = student_io
package.loaded.io = student_io

os.exit = student_exit
os.execute = function(command)
  if command == nil then return false end
  return nil, 'exit', 1
end
os.remove = refuse_open
os.rename = refuse_open
os.tmpname = function() error('unable to generate a unique filename', 2) end

loadfile = function(name) return nil, tostring(name) .. ': ' .. NO_FILES end
dofile = function(name) error(tostring(name) .. ': ' .. NO_FILES, 2) end

-- Run ------------------------------------------------------------------------

-- Like the standalone interpreter: strings and numbers are shown as they are,
-- objects through __tostring when they have one.
local function describe_error(value)
  local kind = type(value)
  if kind == 'string' or kind == 'number' then return tostring(value) end
  local meta = getmetatable(value)
  if type(meta) == 'table' and meta.__tostring ~= nil then
    local ok, text = pcall(tostring, value)
    if ok and type(text) == 'string' then return text end
  end
  return '(error object is a ' .. kind .. ' value)'
end

local code, message = 0, nil
local chunk, load_error = load(source, '=main.lua', 't')
if chunk then
  local ok, failure = pcall(chunk)
  if exit_code ~= nil then
    code = exit_code
  elseif not ok then
    code, message = 1, describe_error(failure)
  end
else
  code, message = 1, load_error
end
flush_streams()
finish(code, message)
`;

interface RunOutcome {
  exitCode: number;
  error?: string;
}

/** Absolute path of the installed `glue.wasm`, for Node, where the file is read from disk. */
async function nodeWasmPath(env: EngineEnv): Promise<string> {
  const { fileURLToPath } = await import('node:url');
  return fileURLToPath(env.assetUrl('wasmoon', 'dist/glue.wasm'));
}

// The chunk name of the scripts above, so a position inside them can never be
// mistaken for one in the student's `main.lua`.
const SUPPORT_CHUNK_NAME = '=lua-support';

/** Runs a support script on a thread of its own and returns its first result. */
async function runSupportScript(lua: LuaEngine, script: string): Promise<unknown> {
  const thread = lua.global.newThread();
  thread.loadString(script, SUPPORT_CHUNK_NAME);
  const results = await thread.run(0);
  return results[0];
}

/** Runs `use` on a Lua state of its own and closes the state afterwards. */
async function withEngine<T>(factory: LuaFactory, use: (lua: LuaEngine) => Promise<T>): Promise<T> {
  const lua = await factory.createEngine();
  try {
    return await use(lua);
  } finally {
    lua.global.close();
  }
}

export const createLuaEngine: EngineFactory = async (env) => {
  const { LuaFactory } = await import('wasmoon');
  const factory = new LuaFactory(env.isNode ? await nodeWasmPath(env) : env.assetUrl('wasmoon', 'dist/glue.wasm'));
  // Instantiate the WASM module now, within the engine load budget.
  await factory.getLuaModule();

  return {
    async compile(source) {
      return withEngine(factory, async (lua) => {
        lua.global.set('__birb_source', source);
        const message = await runSupportScript(lua, COMPILE_SCRIPT);
        return typeof message === 'string' ? message : null;
      });
    },
    async runCase(input, emit: Emit) {
      return withEngine(factory, async (lua): Promise<RunOutcome> => {
        let outcome: RunOutcome | undefined;
        lua.global.set('__birb_source', input.source);
        lua.global.set('__birb_stdin', input.stdin);
        lua.global.set('__birb_emit', (stream: 'stdout' | 'stderr', text: string) => emit(stream, text));
        lua.global.set('__birb_finish', (exitCode: number, message?: string | null) => {
          outcome = typeof message === 'string' ? { exitCode, error: message } : { exitCode };
        });
        try {
          await runSupportScript(lua, RUN_SCRIPT);
        } catch (error) {
          // The support script itself failed (for example, out of memory).
          return { exitCode: 1, error: error instanceof Error ? error.message : String(error) };
        }
        return outcome ?? { exitCode: 1, error: 'The Lua program ended without a result' };
      });
    },
  };
};
