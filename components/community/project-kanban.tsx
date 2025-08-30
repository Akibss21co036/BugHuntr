"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Plus, MoreHorizontal } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface Task {
  id: string
  title: string
  description: string
  priority: "low" | "medium" | "high" | "critical"
  assignee?: string
  tags: string[]
  status: "todo" | "in-progress" | "review" | "done"
}

interface ProjectKanbanProps {
  projectId: string
  tasks?: Task[]
}

const mockTasks: Task[] = [
  {
    id: "1",
    title: "SQL Injection Testing",
    description: "Test login forms for SQL injection vulnerabilities",
    priority: "high",
    assignee: "user1",
    tags: ["sql-injection", "testing"],
    status: "todo",
  },
  {
    id: "2",
    title: "XSS Vulnerability Scan",
    description: "Scan for reflected and stored XSS vulnerabilities",
    priority: "medium",
    assignee: "user2",
    tags: ["xss", "scanning"],
    status: "in-progress",
  },
  {
    id: "3",
    title: "Authentication Bypass",
    description: "Test for authentication bypass vulnerabilities",
    priority: "critical",
    assignee: "user3",
    tags: ["auth", "bypass"],
    status: "review",
  },
  {
    id: "4",
    title: "CSRF Protection Review",
    description: "Review CSRF protection implementation",
    priority: "medium",
    assignee: "user1",
    tags: ["csrf", "review"],
    status: "done",
  },
]

const columns = [
  { id: "todo", title: "To Do", color: "bg-gray-100" },
  { id: "in-progress", title: "In Progress", color: "bg-blue-100" },
  { id: "review", title: "Review", color: "bg-yellow-100" },
  { id: "done", title: "Done", color: "bg-green-100" },
]

export function ProjectKanban({ projectId, tasks = mockTasks }: ProjectKanbanProps) {
  const [taskList, setTaskList] = useState<Task[]>(tasks)

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "destructive"
      case "high":
        return "default"
      case "medium":
        return "secondary"
      case "low":
        return "outline"
      default:
        return "secondary"
    }
  }

  const getTasksByStatus = (status: string) => {
    return taskList.filter((task) => task.status === status)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {columns.map((column) => (
        <div key={column.id} className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">{column.title}</h3>
            <Badge variant="outline" className="text-xs">
              {getTasksByStatus(column.id).length}
            </Badge>
          </div>

          <div className="space-y-3">
            <AnimatePresence>
              {getTasksByStatus(column.id).map((task, index) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-sm font-medium line-clamp-2">{task.title}</CardTitle>
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                          <MoreHorizontal className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>

                      <div className="flex items-center justify-between">
                        <Badge variant={getPriorityColor(task.priority) as any} className="text-xs">
                          {task.priority}
                        </Badge>
                        {task.assignee && (
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs">{task.assignee.charAt(0).toUpperCase()}</AvatarFallback>
                          </Avatar>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-1">
                        {task.tags.slice(0, 2).map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {task.tags.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{task.tags.length - 2}
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>

            <Button
              variant="ghost"
              className="w-full h-12 border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Task
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}
