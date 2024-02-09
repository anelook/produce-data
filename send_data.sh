#!/bin/bash


# Function to send data to Kafka
send_to_kafka() {
    local message="$1"
    echo "$message" | kcat -F kcat.config -P -t mastodon_posts_test4
}

